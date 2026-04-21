param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("local-up", "local-down", "docker-up", "docker-down", "status")]
  [string]$Mode
)

function Stop-PortProcess {
  param([int]$Port)
  $lines = netstat -ano -p tcp | Select-String ":$Port" | Select-String "LISTENING"
  if (-not $lines) {
    return
  }

  $pids = @()
  foreach ($line in $lines) {
    $tokens = $line.ToString().Trim() -split "\s+"
    if ($tokens.Length -gt 0) {
      $pids += $tokens[-1]
    }
  }

  $pids = $pids | Sort-Object -Unique
  foreach ($procId in $pids) {
    if ($procId -and $procId -ne "0") {
      taskkill /PID $procId /F | Out-Null
    }
  }
}

switch ($Mode) {
  "local-up" {
    Write-Host "[local-up] Start MySQL only (Docker)"
    docker compose -f docker-compose.local.yml stop backend frontend | Out-Null
    docker compose -f docker-compose.local.yml up -d mysql

    Write-Host ""
    Write-Host "Run backend/frontend in IDE:"
    Write-Host " - Backend: Backend SpringBoot (local profile)"
    Write-Host " - Frontend: Frontend Next Dev"
    Write-Host "Home: http://localhost:3000"
  }

  "local-down" {
    Write-Host "[local-down] Stop local backend/frontend + MySQL"
    Stop-PortProcess -Port 11115
    Stop-PortProcess -Port 3000
    docker compose -f docker-compose.local.yml stop mysql
  }

  "docker-up" {
    Write-Host "[docker-up] Stop local port listeners and start full Docker stack"
    Stop-PortProcess -Port 11115
    Stop-PortProcess -Port 3000
    docker compose -f docker-compose.local.yml up -d --build
    Write-Host "Home: http://localhost:3000"
  }

  "docker-down" {
    Write-Host "[docker-down] Stop full Docker stack"
    docker compose -f docker-compose.local.yml down
  }

  "status" {
    Write-Host "[status] Docker services"
    docker compose -f docker-compose.local.yml ps
    Write-Host ""
    Write-Host "[status] Port listeners"
    netstat -ano -p tcp | Select-String ":3000|:11115|:3307" | Select-String "LISTENING"
  }
}
