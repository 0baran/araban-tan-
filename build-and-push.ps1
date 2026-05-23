param(
  [switch]$SkipBuild,
  [switch]$SkipPush,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$now = Get-Date
$versionSuffix = $now.ToString("yyyyMMdd.HHmm")
$version = "2.2.$versionSuffix"
$apkName = "ArabaniTani-latest.apk"
$apkUrl = "https://raw.githubusercontent.com/0baran/araban-tan-/main/$apkName"

Write-Host "==> Version: $version" -ForegroundColor Cyan

# --- Read latest changelog notes from Changelog.ts ---
$changelogPath = Join-Path $root "src\services\Changelog.ts"
$cl = Get-Content -LiteralPath $changelogPath -Raw
$fullNotes = ""
# Find the first version entry's items array
$match = [regex]::Match($cl, "version:\s*'[^']*'[\s\S]*?items:\s*\[([\s\S]*?)\],\s*\}")
if ($match.Success) {
  $block = $match.Groups[1].Value
  $itemMatches = [regex]::Matches($block, "'([^']*)'")
  $items = $itemMatches | ForEach-Object { $_.Groups[1].Value }
  $fullNotes = ($items -join "; ").Trim()
}
Write-Host "==> Notes: $fullNotes" -ForegroundColor Cyan

# --- Update App.tsx ---
$appTsxPath = Join-Path $root "App.tsx"
$appTsx = Get-Content -LiteralPath $appTsxPath -Raw
$appTsx = $appTsx -replace "(const APP_VERSION = ')[^']*(')", "`${1}$version`${2}"
Set-Content -LiteralPath $appTsxPath -Value $appTsx -NoNewline
Write-Host "==> App.tsx updated" -ForegroundColor Green

# --- Update version.json ---
$vjPath = Join-Path $root "version.json"
$vjContent = @{ version = $version; url = $apkUrl; notes = $fullNotes } | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($vjPath, $vjContent)
Write-Host "==> version.json updated" -ForegroundColor Green

# --- Build APK ---
if (-not $SkipBuild) {
  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
  Push-Location -LiteralPath (Join-Path $root "android")
  try {
    Write-Host "==> Building APK..." -ForegroundColor Yellow
    $buildOutput = cmd.exe /c ".\gradlew assembleRelease --no-daemon"
    Write-Host $buildOutput
    if ($LASTEXITCODE -ne 0) { throw "Gradle build failed (exit $LASTEXITCODE)" }

    # Verify build output contains our version
    if ($buildOutput -match "BUILD SUCCESSFUL") {
      Write-Host "==> Build successful" -ForegroundColor Green
    } else {
      throw "Build did not complete successfully"
    }
  } finally {
    Pop-Location
  }

  # Copy APK to project root
  $apkSource = Join-Path $root "android\app\build\outputs\apk\release\ArabaniTani-release-v$version.apk"
  if (Test-Path -LiteralPath $apkSource) {
    Copy-Item -LiteralPath $apkSource -Destination (Join-Path $root $apkName) -Force
    Write-Host "==> APK copied: $apkName" -ForegroundColor Green
  } else {
    # Fallback: find any APK
    $builtApk = Get-ChildItem -LiteralPath (Join-Path $root "android\app\build\outputs\apk\release") -Filter "*.apk" | Select-Object -First 1
    if ($builtApk) {
      Copy-Item -LiteralPath $builtApk.FullName -Destination (Join-Path $root $apkName) -Force
      Write-Host "==> APK copied (alt): $($builtApk.Name) -> $apkName" -ForegroundColor Yellow
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
    git commit -m "chore: v$version - otomatik build & push" 2>&1 | Out-Null
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
    if ($LASTEXITCODE -eq 0) {
      Write-Host "==> Install completed" -ForegroundColor Green
    } else {
      Write-Host "==> Install failed" -ForegroundColor Red
    }
  } else {
    Write-Host "==> adb not found at $adbPath, skipping install" -ForegroundColor Yellow
  }
} else {
  Write-Host "==> Install skipped" -ForegroundColor Yellow
}

Write-Host "`n==> Done: $version" -ForegroundColor Cyan
