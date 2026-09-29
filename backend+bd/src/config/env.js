const fs = require('fs');
const path = require('path');

// Carga las variables del archivo .env sin agregar otra dependencia al proyecto.
function loadDotEnv() {
    const envPath = path.resolve(process.cwd(), '.env');

    if (!fs.existsSync(envPath)) return;

    const contenido = fs.readFileSync(envPath, 'utf8');

    for (const linea of contenido.split(/\r?\n/)) {
        const texto = linea.trim();
        if (!texto || texto.startsWith('#')) continue;

        const separador = texto.indexOf('=');
        if (separador === -1) continue;

        const nombre = texto.slice(0, separador).trim();
        let valor = texto.slice(separador + 1).trim();

        if (
            (valor.startsWith('"') && valor.endsWith('"')) ||
            (valor.startsWith("'") && valor.endsWith("'"))
        ) {
            valor = valor.slice(1, -1);
        }

        if (process.env[nombre] === undefined) {
            process.env[nombre] = valor;
        }
    }
}

loadDotEnv();

function getEnv(name, defaultValue) {
    return process.env[name] ?? defaultValue;
}

module.exports = {
    PORT: Number(getEnv('PORT', 3000)),
    DATABASE_URL: getEnv('DATABASE_URL', ''),
    DB_SSL: getEnv('DB_SSL', 'true')
};
