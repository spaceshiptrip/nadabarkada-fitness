@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$scriptDir = (Resolve-Path -LiteralPath '%~dp0').Path;" ^
  "$pidFile = Join-Path $scriptDir '.npm-run-dev.pid';" ^
  "if (Test-Path -LiteralPath $pidFile) {" ^
  "  $rawPid = (Get-Content -LiteralPath $pidFile -Raw).Trim();" ^
  "  if ($rawPid -match '^\d+$') {" ^
  "    $existing = Get-Process -Id ([int]$rawPid) -ErrorAction SilentlyContinue;" ^
  "    if ($existing) { Write-Error \"npm run dev already appears to be running with parent PID $rawPid. Run stop-npm-run-dev.bat first.\"; exit 1 }" ^
  "  }" ^
  "  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue;" ^
  "}" ^
  "$proc = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d','/s','/c','npm run dev') -WorkingDirectory $scriptDir -NoNewWindow -PassThru;" ^
  "Set-Content -LiteralPath $pidFile -Value $proc.Id -NoNewline;" ^
  "Write-Host \"npm run dev parent PID: $($proc.Id)\";" ^
  "try { $proc.WaitForExit(); exit $proc.ExitCode }" ^
  "finally {" ^
  "  if (Test-Path -LiteralPath $pidFile) {" ^
  "    $savedPid = (Get-Content -LiteralPath $pidFile -Raw).Trim();" ^
  "    if ($savedPid -eq [string]$proc.Id) { Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue }" ^
  "  }" ^
  "}"

exit /b %ERRORLEVEL%
