param([string]$Executable='release/Marketing-Academy-Portable-Windows-x64.exe',[string]$ProcessName='Marketing Academy',[string]$Evidence='artifacts/windows-normal-start.json')
$ErrorActionPreference = 'Stop'
$exe = (Resolve-Path $Executable).Path
$fixture = Join-Path $env:TEMP ('academy-normal-' + [guid]::NewGuid().ToString())
$oldPath = $env:Path
$oldData = $env:ACADEMY_TEST_DATA_DIR
$oldNode = $env:NODE_OPTIONS
$oldRun = $env:ELECTRON_RUN_AS_NODE
$oldNodePath = $env:NODE_PATH
$window = $null
$launcher = $null
try {
  $env:ACADEMY_TEST_DATA_DIR = $fixture
  $env:Path = "$env:SystemRoot\System32;$env:SystemRoot"
  Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  Remove-Item Env:NODE_PATH -ErrorAction SilentlyContinue
  # Normal ShellExecute startup: no debug port, installer or application arguments.
  $launcher = Start-Process -FilePath $exe -PassThru
  $deadline = (Get-Date).AddSeconds(90)
  do {
    $window = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq $ProcessName -and $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like '*أكاديمية*' } | Select-Object -First 1
    if ($window) { break }
    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)
  if (-not $window) { throw 'Normal portable launch did not display the Arabic application window.' }
  if (-not $window.Responding) { throw 'Application window is not responding.' }
  New-Item -ItemType Directory -Path artifacts -Force | Out-Null
  @{status='passed'; platform='win32'; executable=(Split-Path $exe -Leaf); launch='normal ShellExecute, no arguments'; visibleWindow=$true; responding=$true; restrictedPath=$true; pristineConsumerWindows=$false} | ConvertTo-Json | Set-Content -Encoding utf8 $Evidence
} finally {
  if ($window) { $null = $window.CloseMainWindow(); Start-Sleep -Seconds 2 }
  if ($launcher -and -not $launcher.HasExited) { & "$env:SystemRoot\System32\taskkill.exe" /PID $launcher.Id /T /F 2>$null | Out-Null }
  if ($window) { Stop-Process -Id $window.Id -Force -ErrorAction SilentlyContinue }
  $env:Path = $oldPath
  $env:ACADEMY_TEST_DATA_DIR = $oldData
  $env:NODE_OPTIONS = $oldNode
  $env:ELECTRON_RUN_AS_NODE = $oldRun
  $env:NODE_PATH = $oldNodePath
  if (Test-Path $fixture) { Remove-Item -Recurse -Force $fixture }
}
