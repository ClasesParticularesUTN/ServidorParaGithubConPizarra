# Script para verificar y configurar el firewall de Windows para el servidor
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación de Firewall para Servidor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  ADVERTENCIA: Este script debe ejecutarse como Administrador" -ForegroundColor Yellow
    Write-Host "   Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    Write-Host ""
}

# Puertos a verificar
$puertos = @(3000, 3001, 3002)

Write-Host "Verificando reglas de firewall para puertos 3000, 3001, 3002..." -ForegroundColor Green
Write-Host ""

foreach ($puerto in $puertos) {
    Write-Host "Puerto $puerto:" -ForegroundColor Yellow
    
    # Verificar reglas de entrada
    $reglas = Get-NetFirewallRule | Where-Object {
        $_.DisplayName -like "*$puerto*" -or 
        ($_.DisplayName -like "*Node*" -or $_.DisplayName -like "*node*")
    } | Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -eq $puerto }
    
    if ($reglas) {
        Write-Host "  ✅ Existen reglas de firewall para el puerto $puerto" -ForegroundColor Green
    } else {
        Write-Host "  ❌ No se encontraron reglas de firewall para el puerto $puerto" -ForegroundColor Red
        
        if ($isAdmin) {
            Write-Host "  🔧 Creando regla de firewall para puerto $puerto..." -ForegroundColor Cyan
            try {
                New-NetFirewallRule -DisplayName "Servidor Node.js Puerto $puerto" `
                    -Direction Inbound `
                    -LocalPort $puerto `
                    -Protocol TCP `
                    -Action Allow `
                    -Profile Private, Domain
                Write-Host "  ✅ Regla creada exitosamente" -ForegroundColor Green
            } catch {
                Write-Host "  ❌ Error al crear regla: $_" -ForegroundColor Red
            }
        } else {
            Write-Host "  💡 Ejecuta este script como Administrador para crear la regla automáticamente" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

# Verificar si Node.js tiene reglas
Write-Host "Verificando reglas para Node.js..." -ForegroundColor Green
$nodeRules = Get-NetFirewallRule | Where-Object {
    $_.DisplayName -like "*Node*" -or $_.DisplayName -like "*node*"
}

if ($nodeRules) {
    Write-Host "  ✅ Existen reglas para Node.js:" -ForegroundColor Green
    $nodeRules | ForEach-Object {
        Write-Host "    - $($_.DisplayName) ($($_.Direction))" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ⚠️  No se encontraron reglas específicas para Node.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación completada" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si el problema persiste, verifica:" -ForegroundColor Yellow
Write-Host "1. Que el servidor esté corriendo (node server.js)" -ForegroundColor White
Write-Host "2. Que uses la IP correcta del servidor (mira la consola del servidor)" -ForegroundColor White
Write-Host "3. Que ambas computadoras estén en la misma red" -ForegroundColor White
Write-Host "4. Que accedas usando http://IP_SERVIDOR:3002 (no localhost)" -ForegroundColor White
Write-Host ""




