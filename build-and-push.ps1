param(
  [switch]$SkipBuild,
  [switch]$SkipPush,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$now = Get-Date
$currentVer = (Get-Content (Join-Path $root "version.json") | ConvertFrom-Json).version
$parts = $currentVer.Split('.')
$patch = [int]$parts[2] + 1
$version = "$($parts[0]).$($parts[1]).$patch"
$apkName = "ArabaniTani-v$version.apk"
$apkUrl = "https://raw.githubusercontent.com/0baran/araban-tan-/main/$apkName"
$jsonUrl = "https://raw.githubusercontent.com/0baran/araban-tan-/main/version.json"

Write-Host "==> Starting build for version $version..." -ForegroundColor Cyan

# package.json versiyon guncelleme
$pkg = Get-Content package.json | ConvertFrom-Json
$pkg.version = $version
$pkg | ConvertTo-Json -Depth 10 | Set-Content package.json

# Sürüm notlarını ayıkla (CHANGELOG.md'den)
$changelogPath = Join-Path $root "CHANGELOG.md"
if (Test-Path $changelogPath) {
  $notesRaw = Get-Content $changelogPath | Select-Object -First 5
  $fullNotes = $notesRaw -join "\n"
} else {
  $fullNotes = "Yenilikler eklendi."
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
    if ($buildOutput -match "SUCCESSFUL") {
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
    git commit -m "chore: v$version - otomatik build & push" | Out-Null
    Write-Host "==> Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
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
