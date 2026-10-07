# Tworzy wydanie gry: podbija wersję, dopisuje notatki do CHANGELOG.md, buduje aplikację
# i instalator, sprawdza je Defenderem, robi commit i tag vX.Y.Z.
# Z -Push od razu publikuje: wysyła main i tag, zakłada wydanie na GitHubie z instalatorem,
# podpisem i latest.json (z niego aplikacja i instalator biorą najnowszą wersję).
#
#   .\release.ps1 -Notes "Mniejsze okienka linii; Zwijanie linii strzałką"
#   .\release.ps1 -Bump minor -Notes "Nowy targ" -Push
#   .\release.ps1 -Publish            # publikuje ostatnie zbudowane wydanie (np. zrobione bez -Push)
#
# -Notes: punkty zmian oddzielone średnikiem.
# Klucz podpisu aktualizacji: ~/.tauri/aura-fields.key (albo zmienna TAURI_SIGNING_PRIVATE_KEY).
# Bez tego klucza zainstalowane gry nie przyjmą aktualizacji, więc trzymaj jego kopię w bezpiecznym miejscu.
[CmdletBinding(DefaultParameterSetName = 'release')]
param(
  [Parameter(ParameterSetName = 'release')][ValidateSet('patch','minor','major')][string]$Bump = 'patch',
  [Parameter(ParameterSetName = 'release', Mandatory = $true)][string]$Notes,
  [Parameter(ParameterSetName = 'release')][switch]$Push,
  [Parameter(ParameterSetName = 'release')][string]$Trailer = '',
  [Parameter(ParameterSetName = 'publish', Mandatory = $true)][switch]$Publish
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$Repo = 'Scepeczki/Aura-Fields'
$Setup = 'Aura-Fields-Setup.exe'
$utf8 = New-Object System.Text.UTF8Encoding $false
function Read-Text($p) { [IO.File]::ReadAllText((Join-Path $PSScriptRoot $p), $utf8) }
function Write-Text($p, $t) { [IO.File]::WriteAllText((Join-Path $PSScriptRoot $p), $t, $utf8) }
function Invoke-Native([scriptblock]$cmd, [string]$what) {
  & $cmd
  if ($LASTEXITCODE -ne 0) { throw "$what (kod $LASTEXITCODE)" }
}
function Current-Version {
  if ((Read-Text 'web/game.js') -notmatch "const VERSION='(\d+\.\d+\.\d+)'") { throw 'Nie znalazłem VERSION w web/game.js' }
  $Matches[1]
}

# Skan Defenderem całego katalogu z plikami wydania; wykrycie przerywa wydanie.
function Test-Defender($dir) {
  $mp = Get-ChildItem "$env:ProgramData\Microsoft\Windows Defender\Platform\*\MpCmdRun.exe" -ErrorAction SilentlyContinue |
    Sort-Object { [version]($_.Directory.Name -replace '-.*$', '') } | Select-Object -Last 1 -ExpandProperty FullName
  if (-not $mp) { $mp = "$env:ProgramFiles\Windows Defender\MpCmdRun.exe" }
  if (-not (Test-Path $mp)) { Write-Warning 'Brak MpCmdRun.exe: pomijam skan Defenderem.'; return }
  Write-Host 'Skan Defenderem...'
  & $mp -SignatureUpdate | Out-Null
  $out = & $mp -Scan -ScanType 3 -File (Resolve-Path $dir).Path -DisableRemediation 2>&1
  $code = $LASTEXITCODE
  if ($code -eq 2) { $out | Write-Host; throw 'Defender zgłosił zagrożenie w plikach wydania. Wydanie wstrzymane.' }
  if ($code -ne 0) { $out | Write-Host; throw "Skan Defenderem nie powiódł się (kod $code)." }
  Write-Host 'Defender: bez zastrzeżeń.' -ForegroundColor Green
}

function Publish-Release($ver) {
  $dir = "dist/v$ver"
  if (-not (Test-Path "$dir/$Setup")) { throw "Brak $dir/$Setup. Najpierw zbuduj wydanie." }
  if (-not (git tag --list "v$ver")) { throw "Brak tagu v$ver" }
  Invoke-Native { git push origin main } 'git push main'
  Invoke-Native { git push origin "v$ver" } 'git push tag'
  $assets = @("$dir/$Setup", "$dir/$Setup.sig", "$dir/latest.json", "$dir/aura-fields-v$ver.zip")
  Invoke-Native { gh release create "v$ver" @assets -R $Repo --title "Aura Fields v$ver" --notes-file "$dir/notes.md" } 'gh release create'
  Write-Host "Opublikowano v${ver}: https://github.com/$Repo/releases/tag/v$ver" -ForegroundColor Green
}

if ($Publish) { Publish-Release (Current-Version); return }

if (git status --porcelain) { throw 'W repozytorium są niezapisane zmiany. Zrób commit albo je odłóż przed wydaniem.' }

$cur = (Current-Version).Split('.') | ForEach-Object { [int]$_ }
$maj, $min, $pat = $cur
switch ($Bump) { 'major' { $maj++; $min = 0; $pat = 0 } 'minor' { $min++; $pat = 0 } default { $pat++ } }
$ver = "$maj.$min.$pat"
if (git tag --list "v$ver") { throw "Tag v$ver już istnieje" }

$key = $env:TAURI_SIGNING_PRIVATE_KEY
if (-not $key) { $key = Join-Path $HOME '.tauri/aura-fields.key' }
if (-not ($env:TAURI_SIGNING_PRIVATE_KEY) -and -not (Test-Path $key)) { throw "Brak klucza podpisu aktualizacji: $key" }

$date = Get-Date -Format 'yyyy-MM-dd'
$items = $Notes -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
$points = ($items | ForEach-Object { "- $_" }) -join "`n"

# --- wersja wszędzie tam, gdzie jest zapisana ---
$bumped = 'web/game.js', 'web/sw.js', 'package.json', 'package-lock.json', 'src-tauri/Cargo.toml', 'src-tauri/Cargo.lock', 'CHANGELOG.md'
try {
  Write-Text 'web/game.js' ((Read-Text 'web/game.js') -replace "const VERSION='[\d.]+'", "const VERSION='$ver'")
  Write-Text 'web/sw.js' ((Read-Text 'web/sw.js') -replace "const CACHE='aura-fields-[\d.]+'", "const CACHE='aura-fields-$ver'")
  Write-Text 'package.json' ((Read-Text 'package.json') -replace '(?m)^(  "version": ")[^"]+', "`${1}$ver")
  Write-Text 'package-lock.json' ((Read-Text 'package-lock.json') -replace '(?s)^(\{\s*"name": "aura-fields",\s*"version": ")[^"]+(.*?"packages": \{\s*"": \{\s*"name": "aura-fields",\s*"version": ")[^"]+', "`${1}$ver`${2}$ver")
  Write-Text 'src-tauri/Cargo.toml' ((Read-Text 'src-tauri/Cargo.toml') -replace '(?m)^version = "[^"]+"', "version = `"$ver`"")
  Write-Text 'src-tauri/Cargo.lock' ((Read-Text 'src-tauri/Cargo.lock') -replace '(name = "aura-fields"\r?\nversion = ")[^"]+', "`${1}$ver")

  $log = Read-Text 'CHANGELOG.md'
  $entry = "## $ver — $date`n`n$points`n`n"
  $i = $log.IndexOf('## ')
  $log = if ($i -ge 0) { $log.Substring(0, $i) + $entry + $log.Substring($i) } else { $log + "`n" + $entry }
  Write-Text 'CHANGELOG.md' $log

  # --- aplikacja i instalator ---
  Write-Host "Budowanie Aura Fields $ver..."
  $nsis = "src-tauri/target/release/bundle/nsis"
  if (Test-Path $nsis) { Remove-Item $nsis -Recurse -Force }
  $env:TAURI_SIGNING_PRIVATE_KEY = $key
  if ($null -eq $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD) { $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = '' }
  Invoke-Native { npx tauri build } 'Budowanie nie powiodło się'

  $built =Get-ChildItem $nsis -Filter "*_${ver}_x64-setup.exe" | Select-Object -First 1
  if (-not $built -or -not (Test-Path "$($built.FullName).sig")) { throw "Nie znalazłem instalatora $ver z podpisem w $nsis" }

  $dir = "dist/v$ver"
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
  New-Item -ItemType Directory $dir | Out-Null
  Copy-Item $built.FullName "$dir/$Setup"
  Copy-Item "$($built.FullName).sig" "$dir/$Setup.sig"
  Compress-Archive -Path 'web/*' -DestinationPath "$dir/aura-fields-v$ver.zip"

  $notesMd = "$points`n`n**Pobierz:** [$Setup](https://github.com/$Repo/releases/download/v$ver/$Setup) (Windows 10/11)`n"
  Write-Text "$dir/notes.md" $notesMd
  $sig = (Get-Content "$dir/$Setup.sig" -Raw).Trim()
  $url = "https://github.com/$Repo/releases/download/v$ver/$Setup"
  $latest = [ordered]@{
    version   = $ver
    notes     = $points
    pub_date  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    platforms = [ordered]@{
      'windows-x86_64'      = [ordered]@{ signature = $sig; url = $url }
      'windows-x86_64-nsis' = [ordered]@{ signature = $sig; url = $url }
    }
  }
  Write-Text "$dir/latest.json" ($latest | ConvertTo-Json -Depth 5)

  Test-Defender $dir
} catch {
  Write-Host 'Przywracam pliki wersji sprzed próby wydania.' -ForegroundColor Yellow
  git checkout -- @bumped 2>$null
  throw
}

# --- commit i tag ---
Invoke-Native { git add -A } 'git add'
$msg = "Wydanie v$ver`n`n$points"
if ($Trailer) { $msg += "`n`n$Trailer" }
Invoke-Native { git commit -q -m $msg } 'git commit'
Invoke-Native { git tag -a "v$ver" -m "Aura Fields v$ver" } 'git tag'
Write-Host "Utworzono wydanie v$ver (commit, tag, pliki w dist/v$ver)." -ForegroundColor Green

if ($Push) { Publish-Release $ver }
else { Write-Host 'Aby opublikować: .\release.ps1 -Publish' }
