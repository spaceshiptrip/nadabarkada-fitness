@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$scriptDir = (Resolve-Path -LiteralPath '%~dp0').Path;" ^
  "$pidFile = Join-Path $scriptDir '.npm-run-dev.pid';" ^
  "if (-not (Test-Path -LiteralPath $pidFile)) { Write-Host \"No npm run dev PID file found at $pidFile\"; exit 0 }" ^
  "$rawPid = (Get-Content -LiteralPath $pidFile -Raw).Trim();" ^
  "if ($rawPid -notmatch '^\d+$') { Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue; Write-Error \"Invalid PID file contents: $rawPid\"; exit 1 }" ^
  "$pidToStop = [int]$rawPid;" ^
  "$existing = Get-Process -Id $pidToStop -ErrorAction SilentlyContinue;" ^
  "if (-not $existing) { Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue; Write-Host \"Process $pidToStop is not running. Removed stale PID file.\"; exit 0 }" ^
  "Write-Host \"Stopping npm run dev process tree rooted at PID $pidToStop\";" ^
  "$taskkill = Start-Process -FilePath 'taskkill.exe' -ArgumentList @('/F','/T','/PID',[string]$pidToStop) -NoNewWindow -Wait -PassThru;" ^
  "Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue;" ^
  "exit $taskkill.ExitCode"

exit /b %ERRORLEVEL%
