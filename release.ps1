# Tworzy wydanie gry: podbija wersję, dopisuje notatki do CHANGELOG.md, robi commit i tag vX.Y.Z.
# Z -Push od razu wysyła wszystko na GitHuba (tag uruchamia workflow „Wydanie”, main aktualizuje stronę gry).
#
#   .\release.ps1 -Notes "Mniejsze okienka linii; Zwijanie linii strzałką"
#   .\release.ps1 -Bump minor -Notes "Nowy targ" -Push
#
# -Notes: punkty zmian oddzielone średnikiem.
param(
  [ValidateSet('patch','minor','major')][string]$Bump = 'patch',
  [Parameter(Mandatory = $true)][string]$Notes,
  [switch]$Push,
  [string]$Trailer = ''
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding $false
function Read-Text($p) { [IO.File]::ReadAllText((Join-Path $PSScriptRoot $p), $utf8) }
function Write-Text($p, $t) { [IO.File]::WriteAllText((Join-Path $PSScriptRoot $p), $t, $utf8) }

$game = Read-Text 'game.js'
if ($game -notmatch "const VERSION='(\d+)\.(\d+)\.(\d+)'") { throw 'Nie znalazłem VERSION w game.js' }
$maj = [int]$Matches[1]; $min = [int]$Matches[2]; $pat = [int]$Matches[3]
switch ($Bump) { 'major' { $maj++; $min = 0; $pat = 0 } 'minor' { $min++; $pat = 0 } default { $pat++ } }
$ver = "$maj.$min.$pat"
if (git tag --list "v$ver") { throw "Tag v$ver już istnieje" }

Write-Text 'game.js' ($game -replace "const VERSION='[\d.]+'", "const VERSION='$ver'")
Write-Text 'sw.js' ((Read-Text 'sw.js') -replace "const CACHE='aura-fields-[\d.]+'", "const CACHE='aura-fields-$ver'")

$date = Get-Date -Format 'yyyy-MM-dd'
$points = ($Notes -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ } | ForEach-Object { "- $_" }) -join "`n"
$log = Read-Text 'CHANGELOG.md'
$entry = "## $ver — $date`n`n$points`n`n"
$i = $log.IndexOf('## ')
$log = if ($i -ge 0) { $log.Substring(0, $i) + $entry + $log.Substring($i) } else { $log + "`n" + $entry }
Write-Text 'CHANGELOG.md' $log

git add -A
$msg = "Wydanie v$ver`n`n$points"
if ($Trailer) { $msg += "`n`n$Trailer" }
git commit -q -m $msg
git tag -a "v$ver" -m "Aura Fields v$ver"
Write-Host "Utworzono wydanie v$ver (commit i tag)."

if ($Push) {
  git push origin main
  git push origin "v$ver"
  Write-Host "Wysłano na GitHuba: main i v$ver."
} else {
  Write-Host "Aby wysłać: git push origin main; git push origin v$ver"
}
