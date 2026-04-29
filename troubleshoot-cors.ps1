#!/usr/bin/env powershell
# CORS Error Troubleshooting Script
# Execute: powershell -ExecutionPolicy Bypass -File troubleshoot-cors.ps1

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   CORS Error Troubleshooting - leocamposftv            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://api.leocamposftv.com"
$apiLocal = "http://localhost:3001"
$frontendUrl = "https://leocamposftv.com"

# Test 1: Remote API Status
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "[TEST 1] Remote API Status (Production)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$apiUrl/api/health" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $statusCode = $response.StatusCode
    
    if ($statusCode -eq 200) {
        Write-Host "✅ PRODUCTION API is ONLINE (HTTP 200)" -ForegroundColor Green
        Write-Host "   Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Compress)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected status: HTTP $statusCode" -ForegroundColor Yellow
    }
} catch [System.Net.Http.HttpRequestException] {
    Write-Host "❌ PRODUCTION API OFFLINE (HTTP 503 or similar)" -ForegroundColor Red
    Write-Host "   Error: Connection failed or 503 error" -ForegroundColor Red
    Write-Host "   Action: Check if Hostinger panel shows app is running" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Could not connect to production API" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Local Backend
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "[TEST 2] Local Backend Status (Development)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$apiLocal/api/health" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $statusCode = $response.StatusCode
    
    if ($statusCode -eq 200) {
        Write-Host "✅ LOCAL BACKEND is ONLINE (HTTP 200)" -ForegroundColor Green
        Write-Host "   Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Compress)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ LOCAL BACKEND OFFLINE or NOT RUNNING" -ForegroundColor Red
    Write-Host "   Start it with: npm start (from backend folder)" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: CORS Preflight (Production)
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "[TEST 3] CORS Preflight (Production)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray

try {
    $headers = @{
        "Origin" = $frontendUrl
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    
    $response = Invoke-WebRequest -Uri "$apiUrl/api/auth/login" -Method OPTIONS -Headers $headers -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $statusCode = $response.StatusCode
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    
    if ($corsHeader -and $statusCode -eq 200) {
        Write-Host "✅ CORS PREFLIGHT OK (HTTP 200)" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $corsHeader" -ForegroundColor Green
    } else {
        Write-Host "❌ CORS PREFLIGHT FAILED" -ForegroundColor Red
        Write-Host "   Status: HTTP $statusCode" -ForegroundColor Red
        Write-Host "   CORS Header: $(if ($corsHeader) { $corsHeader } else { 'MISSING' })" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ CORS PREFLIGHT ERROR" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Environment Variables Check
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "[TEST 4] Environment Variables (Local)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray

$vars = @("JWT_SECRET", "DATABASE_URL", "NODE_ENV", "PORT")
foreach ($var in $vars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        Write-Host "✅ $var = [set]" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $var = [not set locally]" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 5: Process Check
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "[TEST 5] Node.js Processes" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Node.js is running:" -ForegroundColor Green
    foreach ($proc in $nodeProcesses) {
        Write-Host "   - PID $($proc.Id)" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No Node.js processes running" -ForegroundColor Yellow
    Write-Host "   To start local backend: npm start (from backend folder)" -ForegroundColor Gray
}

Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   DIAGNOSIS SUMMARY                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "What to do next:" -ForegroundColor Yellow
Write-Host ""
Write-Host "If TEST 1 (Production) = ❌ OFFLINE:" -ForegroundColor Red
Write-Host "  → Go to Hostinger panel and configure environment variables" -ForegroundColor Gray
Write-Host "  → Then click Redeploy on the Node.js app" -ForegroundColor Gray
Write-Host "  → Read: ENV_VARIABLES_HOSTINGER.md" -ForegroundColor Gray
Write-Host ""

Write-Host "If TEST 2 (Local) = ❌ OFFLINE:" -ForegroundColor Red
Write-Host "  → Start backend locally with: npm start" -ForegroundColor Gray
Write-Host "  → Run: start-backend-local.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "If TEST 3 (CORS) = ❌ FAILED:" -ForegroundColor Red
Write-Host "  → Backend must be online first (see above)" -ForegroundColor Gray
Write-Host "  → CORS headers appear automatically when backend online" -ForegroundColor Gray
Write-Host ""

Write-Host "If ALL TESTS = ✅ PASS:" -ForegroundColor Green
Write-Host "  → Try login at https://leocamposftv.com" -ForegroundColor Gray
Write-Host "  → Should work without CORS errors" -ForegroundColor Gray
Write-Host ""
