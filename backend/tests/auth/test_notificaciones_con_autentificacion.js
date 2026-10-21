const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { randomBytes, randomUUID, generateKeyPairSync } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { after, before } = require('node:test');

const BACKEND_DIR = path.resolve(__dirname, '../..');
const AUTH_DIR = path.resolve(BACKEND_DIR, '../../auth/backend');
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:10000';
const NOTIFICACIONES_URL = process.env.NOTIFICACIONES_URL || 'http://localhost:3001';
const DATABASE_URL = 'postgresql://admin:adminpassword@localhost:5432/ticketu?schema=public';
const AUTH_TIMEOUT_MS = Number(process.env.TEST_STARTUP_TIMEOUT_MS || 120000);
const AUTH_HEALTH_URL = new URL('/api/health', AUTH_URL).toString();
const NOTIFICACIONES_HEALTH_URL = new URL('/health', NOTIFICACIONES_URL).toString();
const startedProcesses = [];
let startedDatabase = false;

if (!Number.isSafeInteger(AUTH_TIMEOUT_MS) || AUTH_TIMEOUT_MS <= 0) {
    throw new Error('TEST_STARTUP_TIMEOUT_MS debe ser un entero positivo.');
}

function run(command, args, cwd, env = process.env) {
    const result = spawnSync(command, args, {
        cwd,
        env,
        encoding: 'utf8',
        stdio: 'pipe',
        windowsHide: true,
        shell: process.platform === 'win32' && command === 'npm'
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(
            `${command} ${args.join(' ')} falló en ${cwd}.\n${result.stdout}\n${result.stderr}`
        );
    }
    return result.stdout.trim();
}

function runNode(args, cwd, env = process.env) {
    return run(process.execPath, args, cwd, env);
}

function docker(args) {
    return run('docker', args, AUTH_DIR);
}

function npm(args, cwd) {
    return run('npm', args, cwd);
}

function ensureDependencies(directory) {
    if (!fs.existsSync(path.join(directory, 'node_modules'))) {
        console.log(`Instalando dependencias en ${directory}...`);
        npm(['install'], directory);
    }
}

function ensureRsaKeys() {
    const privateKeyPath = path.join(AUTH_DIR, 'private.pem');
    const publicKeyPath = path.join(AUTH_DIR, 'public.pem');
    const privateExists = fs.existsSync(privateKeyPath);
    const publicExists = fs.existsSync(publicKeyPath);

    if (privateExists && publicExists) return;
    if (privateExists || publicExists) {
        throw new Error('Solo existe una llave RSA en Auth. Revisa private.pem y public.pem; no se sobrescribió ninguna.');
    }

    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    fs.writeFileSync(privateKeyPath, privateKey, { flag: 'wx' });
    fs.writeFileSync(publicKeyPath, publicKey, { flag: 'wx' });
    console.log('Generadas las llaves RSA locales de Auth.');
}

function launchNode(args, cwd, env) {
    const child = spawn(process.execPath, args, {
        cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
    });
    child.output = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { child.output += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { child.output += chunk; });
    child.on('error', error => { child.startError = error; });
    startedProcesses.push(child);
    return child;
}

async function waitForHealthyService(url, child, serviceName) {
    const deadline = Date.now() + AUTH_TIMEOUT_MS;
    let lastError;

    while (Date.now() < deadline) {
        if (child.startError) throw child.startError;
        if (child.exitCode !== null) {
            throw new Error(`${serviceName} terminó antes de responder.\n${child.output}`);
        }
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
            if (response.ok) return;
            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            lastError = error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(
        `${serviceName} no respondió correctamente en ${url} dentro de ${AUTH_TIMEOUT_MS} ms.` +
        `${lastError ? ` Último error: ${lastError.message}.` : ''}\n${child.output}`
    );
}

async function serviceIsHealthy(url) {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
        return response.ok;
    } catch {
        return false;
    }
}

async function waitForDatabase() {
    const deadline = Date.now() + AUTH_TIMEOUT_MS;
    let lastError;

    while (Date.now() < deadline) {
        try {
            docker(['compose', 'exec', '-T', 'db', 'pg_isready', '-U', 'admin', '-d', 'ticketu']);
            return;
        } catch (error) {
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    throw new Error(`PostgreSQL no quedó listo.${lastError ? ` ${lastError.message}` : ''}`);
}

async function startTestEnvironment() {
    ensureDependencies(AUTH_DIR);
    ensureDependencies(BACKEND_DIR);

    const runningServices = docker(['compose', 'ps', '--status', 'running', '--services']);
    startedDatabase = !runningServices.split(/\r?\n/).includes('db');
    docker(['compose', 'up', '-d', 'db']);
    await waitForDatabase();

    ensureRsaKeys();
    const authEnv = {
        ...process.env,
        PORT: '10000',
        NODE_ENV: 'development',
        DATABASE_URL
    };
    runNode([path.join(AUTH_DIR, 'node_modules', 'prisma', 'build', 'index.js'), 'generate'], AUTH_DIR, authEnv);
    runNode([path.join(AUTH_DIR, 'node_modules', 'prisma', 'build', 'index.js'), 'db', 'push'], AUTH_DIR, authEnv);
    runNode([path.join(AUTH_DIR, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js'), 'build'], AUTH_DIR, authEnv);

    if (!await serviceIsHealthy(AUTH_HEALTH_URL)) {
        const authChild = launchNode([path.join(AUTH_DIR, 'dist', 'main.js')], AUTH_DIR, authEnv);
        await waitForHealthyService(AUTH_HEALTH_URL, authChild, 'Auth');
    }

    const notificacionesEnv = {
        ...process.env,
        PORT: '3001',
        AUTH_SERVICE_URL: AUTH_URL,
        AUTH_TIMEOUT_MS: '5000',
        FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
        DATABASE_URL: '',
        BROKER_MODE: 'mock'
    };
    if (!await serviceIsHealthy(NOTIFICACIONES_HEALTH_URL)) {
        const notificacionesChild = launchNode([path.join(BACKEND_DIR, 'app.js')], BACKEND_DIR, notificacionesEnv);
        await waitForHealthyService(NOTIFICACIONES_HEALTH_URL, notificacionesChild, 'Notificaciones');
    }
}

async function stopProcess(child) {
    if (child.exitCode !== null || child.killed) return;
    child.kill();
    await Promise.race([
        new Promise(resolve => child.once('exit', resolve)),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]);
    if (child.exitCode === null) child.kill('SIGKILL');
}

before(startTestEnvironment);

after(async () => {
    for (const child of startedProcesses.reverse()) {
        await stopProcess(child);
    }
    if (startedDatabase) {
        docker(['compose', 'stop', 'db']);
    }
});

async function leerJson(response, contexto) {
    const texto = await response.text();
    try {
        return texto ? JSON.parse(texto) : null;
    } catch (error) {
        throw new Error(`${contexto}: el servicio devolvió una respuesta JSON inválida.`, { cause: error });
    }
}

async function verificarEstado(response, esperado, contexto) {
    if (response.status !== esperado) {
        throw new Error(`${contexto}: HTTP ${response.status} ${await response.text()}`);
    }
}

function obtenerCookieSesion(response) {
    const cookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [response.headers.get('set-cookie')].filter(Boolean);
    const cookie = cookies.find(valor => /^jwt_token=/.test(valor));
    assert.ok(cookie, 'El login no devolvió la cookie jwt_token.');
    return cookie.split(';', 1)[0];
}

test('registra un usuario, valida su sesión y consulta su centro de notificaciones', async () => {
    const unique = randomUUID();
    const usuario = {
        email: `test-${unique}@example.com`,
        password: randomBytes(24).toString('base64url'),
        nombre: `Prueba de integración ${unique}`,
        rut: `DEV-${unique.replaceAll('-', '').slice(0, 12)}`
    };

    const registro = await fetch(`${AUTH_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario),
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS)
    });
    await verificarEstado(registro, 201, 'El registro falló');

    const login = await fetch(`${AUTH_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuario.email, password: usuario.password }),
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS)
    });
    await verificarEstado(login, 200, 'El login falló');
    const cookie = obtenerCookieSesion(login);

    const validacion = await fetch(`${AUTH_URL}/api/auth/validar-sesion`, {
        headers: { Cookie: cookie },
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS)
    });
    assert.equal(validacion.status, 200, 'Auth no aceptó la cookie de sesión.');
    const perfil = await leerJson(validacion, 'Validación de sesión');
    assert.equal(perfil?.valido, true, 'Auth no devolvió una sesión válida.');
    assert.ok(perfil?.usuario?.id_usuario, 'Auth no devolvió el identificador del usuario.');

    const sinCookie = await fetch(`${NOTIFICACIONES_URL}/api/notificaciones`, {
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS)
    });
    assert.equal(sinCookie.status, 401, 'Notificaciones debería rechazar la petición sin cookie.');

    const centro = await fetch(`${NOTIFICACIONES_URL}/api/notificaciones`, {
        headers: { Cookie: cookie },
        signal: AbortSignal.timeout(AUTH_TIMEOUT_MS)
    });
    await verificarEstado(centro, 200, 'Notificaciones rechazó la sesión');
    const notificaciones = await leerJson(centro, 'Centro de notificaciones');
    assert.deepEqual(notificaciones, [], 'El usuario recién creado debería comenzar sin notificaciones.');

    console.log('Correcto: registro, login, cookie, validación y centro vacío ([]).');
});
