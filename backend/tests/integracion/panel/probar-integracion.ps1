$ErrorActionPreference = 'Stop'
$identificador = [Guid]::NewGuid().ToString('N').Substring(0, 12)
$proyecto = "ticketu-panel-test-$identificador"
$archivo = Join-Path $PSScriptRoot 'docker-compose.yml'
$compose = @('compose', '-p', $proyecto, '-f', $archivo)

try {
    docker @compose up --build -d --wait --wait-timeout 120
    if ($LASTEXITCODE -ne 0) {
        throw 'No se pudo iniciar el entorno aislado de Panel y Notificaciones.'
    }

    docker @compose exec -T notificaciones node tests/integracion/panel/test_panel_notificaciones.js
    if ($LASTEXITCODE -ne 0) {
        throw 'Fallo la prueba de Panel y Notificaciones.'
    }
}
catch {
    docker @compose logs --tail 40 panel notificaciones rabbit postgres
    throw
}
finally {
    docker @compose down --volumes
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "No se pudo retirar el entorno aislado $proyecto."
    }
}
