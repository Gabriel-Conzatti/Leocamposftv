#!/usr/bin/env pwsh

# Script para monitorar API durante redeploy
# Uso: .\monitor-api-redeploy.ps1

$apiUrl = "https://api.leocamposftv.com/api/health"
$maxWait = 300
$checkInterval = 10
$elapsed = 0

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "MONITORANDO REDEPLOY DO HOSTINGER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Aguardando resposta da API..." -ForegroundColor Yellow
Write-Host "URL: $apiUrl" -ForegroundColor Gray
Write-Host ""

$attempt = 0
$found = $false

while ($elapsed -lt $maxWait -and -not $found) {
    $attempt++
    $elapsedMin = [math]::Floor($elapsed / 60)
    $elapsedSec = $elapsed % 60
    
    Write-Host "[$elapsedMin m ${elapsedSec}s] Tentativa #$attempt..." -ForegroundColor Gray -NoNewline
    
    try {
        $response = curl.exe -s -w "`n%{http_code}" "$apiUrl" 2>$null
        $lines = $response -split "`n"
        $httpCode = $lines[-1]
        
        if ($httpCode -eq "200") {
            Write-Host " OK!" -ForegroundColor Green
            Write-Host ""
            Write-Host "API ESTA ONLINE!" -ForegroundColor Green
            Write-Host ""
            $found = $true
            
        } elseif ($httpCode -eq "503") {
            Write-Host " 503 (deploy em progresso)" -ForegroundColor Yellow
        } else {
            Write-Host " HTTP $httpCode" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " Erro de conexao" -ForegroundColor Yellow
    }
    
    if (-not $found -and $elapsed -lt $maxWait) {
        Start-Sleep -Seconds $checkInterval
        $elapsed += $checkInterval
    }
}

if ($found) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "TUDO PRONTO! Pode fazer login em https://leocamposftv.com" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "TIMEOUT: API nao respondeu em ${maxWait}s" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "1. Painel Hostinger (hpanel.hostinger.com)" -ForegroundColor Yellow
    Write-Host "2. Build Logs para erros" -ForegroundColor Yellow
}

Write-Host ""
