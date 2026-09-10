# ==============================================================================
# 臺大課程日曆好朋友 (NTU Course Calendar) - 獨立 Repo 推送腳本 (PowerShell)
# 用法:
#   .\push.ps1 "你的 commit 說明" [遠端倉庫網址]
# 範例:
#   .\push.ps1 "feat: 更新課表書籤與介面"
# ==============================================================================

param (
    [string]$Comment,
    [string]$RemoteUrl
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$RemoteFile = Join-Path $ScriptDir ".remote_url"

# 1. 取得或提示 Commit 訊息
if (-not $Comment) {
    $Comment = Read-Host "請輸入 Commit 訊息"
}

if (-not $Comment) {
    Write-Host "❌ 錯誤: Commit 訊息不能為空！" -ForegroundColor Red
    exit 1
}

# 2. 取得或設定遠端倉庫 URL
if ($RemoteUrl) {
    Set-Content -Path $RemoteFile -Value $RemoteUrl.Trim() -Encoding UTF8
} elseif (Test-Path $RemoteFile) {
    $RemoteUrl = (Get-Content -Path $RemoteFile -Raw).Trim()
}

if (-not $RemoteUrl) {
    Write-Host "💡 尚未設定目標 GitHub Repo 網址。" -ForegroundColor Yellow
    $RemoteUrl = Read-Host "請輸入遠端 Repo URL (例如 https://github.com/<your-username>/ntu-course-calendar.git)"
    if ($RemoteUrl) {
        Set-Content -Path $RemoteFile -Value $RemoteUrl.Trim() -Encoding UTF8
    } else {
        Write-Host "❌ 錯誤: 必須提供遠端 Repo URL！" -ForegroundColor Red
        exit 1
    }
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🚀 準備推送至獨立 Repo:" -ForegroundColor Cyan
Write-Host "   目標: $RemoteUrl"
Write-Host "   訊息: $Comment"
Write-Host "==================================================" -ForegroundColor Cyan

# 3. 判斷是否為獨立 git 倉庫或使用隔離 git
if (Test-Path (Join-Path $ScriptDir ".git")) {
    git add -A
    git commit -m $Comment
    git remote set-url origin $RemoteUrl 2>$null
    if ($LASTEXITCODE -ne 0) {
        git remote add origin $RemoteUrl
    }
    git branch -M main
    git push -u origin main
} else {
    $env:GIT_DIR = (Join-Path $ScriptDir ".standalone_git")
    $env:GIT_WORK_TREE = $ScriptDir

    if (-not (Test-Path $env:GIT_DIR)) {
        Write-Host "📦 初始化獨立 Git 環境..." -ForegroundColor Yellow
        git init -b main
        git remote add origin $RemoteUrl
    } else {
        git remote set-url origin $RemoteUrl 2>$null
        if ($LASTEXITCODE -ne 0) {
            git remote add origin $RemoteUrl
        }
    }

    git add -A
    git commit -m $Comment
    git branch -M main
    git push -u origin main
}

Write-Host "==================================================" -ForegroundColor Green
Write-Host "🎉 推送完成！已同步至 $RemoteUrl" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
