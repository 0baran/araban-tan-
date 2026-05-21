param(
  [switch]$SkipBuild,
  [switch]$SkipPush,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- Compute version ---
$now = Get-Date
$versionSuffix = $now.ToString("yyyyMMdd.HHmm")
$version = "2.2.$versionSuffix"
$apkName = "ArabaniTani-v$version.apk"
Write-Host "==> Version: $version" -ForegroundColor Cyan

# --- Read latest changelog notes from Changelog.ts ---
$changelogPath = Join-Path $root "src\services\Changelog.ts"
$changelogContent = Get-Content -LiteralPath $changelogPath -Raw

# Extract items from the first version entry (latest)
$match = [regex]::Match($changelogContent, "'2\.2\.[\d\.]+'[\s\S]*?items:\s*\[([\s\S]*?)\],\s*\}\]")
$fullNotes = ""
if ($match.Success) {
  $itemsBlock = $match.Groups[1].Value
  $itemMatches = [regex]::Matches($itemsBlock, "'([^']*)'")
  $items = $itemMatches | ForEach-Object { $_.Groups[1].Value }
  $fullNotes = ($items -join "; ").Trim()
}
Write-Host "==> Notes: $fullNotes" -ForegroundColor Cyan

# --- Update App.tsx APP_VERSION ---
$appTsxPath = Join-Path $root "App.tsx"
$appTsx = Get-Content -LiteralPath $appTsxPath -Raw
$appTsx = $appTsx -replace "(const APP_VERSION = ')[^']*(')", "`${1}$version`${2}"
Set-Content -LiteralPath $appTsxPath -Value $appTsx -NoNewline
Write-Host "==> App.tsx APP_VERSION updated to $version" -ForegroundColor Green

# --- Update version.json ---
$versionJsonPath = Join-Path $root "version.json"
$vj = Get-Content -LiteralPath $versionJsonPath -Raw | ConvertFrom-Json
$vj.version = $version
$vj.url = "https://raw.githubusercontent.com/0baran/araban-tan-/main/$apkName"
$vj.notes = $fullNotes
$vj | ConvertTo-Json -Compress | Set-Content -LiteralPath $versionJsonPath -NoNewline
Write-Host "==> version.json updated" -ForegroundColor Green

# --- Build APK ---
if (-not $SkipBuild) {
  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
  Push-Location -LiteralPath (Join-Path $root "android")
  try {
    Write-Host "==> Building APK..." -ForegroundColor Yellow
    & .\gradlew assembleRelease --no-daemon 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }
  } finally {
    Pop-Location
  }

  # --- Copy APK to root ---
  $apkSource = Join-Path $root "android\app\build\outputs\apk\release\ArabaniTani-release-v$version.apk"
  if (Test-Path -LiteralPath $apkSource) {
    Copy-Item -LiteralPath $apkSource -Destination (Join-Path $root $apkName) -Force
    Write-Host "==> APK copied: $apkName" -ForegroundColor Green
  } else {
    Write-Host "==> APK not found at $apkSource, checking for alternative..." -ForegroundColor Yellow
    $builtApk = Get-ChildItem -LiteralPath (Join-Path $root "android\app\build\outputs\apk\release") -Filter "*.apk" | Select-Object -First 1
    if ($builtApk) {
      Copy-Item -LiteralPath $builtApk.FullName -Destination (Join-Path $root $apkName) -Force
      Write-Host "==> APK copied from alternative: $($builtApk.Name)" -ForegroundColor Green
    } else {
      throw "No APK found in build output"
    }
  }
} else {
  Write-Host "==> Build skipped" -ForegroundColor Yellow
}

# --- Push to GitHub ---
if (-not $SkipPush) {
  Push-Location -LiteralPath $root
  try {
    git add -A
    git add -f $apkName
    git commit -m "chore: v$version - otomatik build & push"
    Write-Host "==> Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main 2>&1
    Write-Host "==> Push completed" -ForegroundColor Green
  } finally {
    Pop-Location
  }
} else {
  Write-Host "==> Push skipped" -ForegroundColor Yellow
}

# --- Install to device ---
if (-not $SkipInstall) {
  $adbPath = "C:\Users\BALKAN\AppData\Local\Android\Sdk\platform-tools\adb.exe"
  if (Test-Path -LiteralPath $adbPath) {
    $apkFullPath = Join-Path $root $apkName
    Write-Host "==> Installing APK..." -ForegroundColor Yellow
    & $adbPath install -r $apkFullPath 2>&1
    Write-Host "==> Installation completed" -ForegroundColor Green
  } else {
    Write-Host "==> adb not found, skipping install" -ForegroundColor Yellow
  }
} else {
  Write-Host "==> Install skipped" -ForegroundColor Yellow
}

Write-Host "`n==> Done: $version" -ForegroundColor Cyan
