#!/usr/bin/env bash
# ==============================================================================
# 臺大課程日曆好朋友 (NTU Course Calendar) - 獨立 Repo 推送腳本
# 用法:
#   ./push.sh "你的 commit 說明" [遠端倉庫網址]
# 範例:
#   ./push.sh "feat: 更新課表書籤與介面"
# ==============================================================================

set -e

# 切換至腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMMENT="$1"
REMOTE_ARG="$2"
REMOTE_FILE=".remote_url"

# 1. 取得或提示 Commit 訊息
if [ -z "$COMMENT" ]; then
  read -r -p "請輸入 Commit 訊息: " COMMENT
fi

if [ -z "$COMMENT" ]; then
  echo "❌ 錯誤: Commit 訊息不能為空！"
  exit 1
fi

# 2. 取得或設定遠端倉庫 URL
REMOTE_URL=""
if [ -n "$REMOTE_ARG" ]; then
  REMOTE_URL="$REMOTE_ARG"
  echo "$REMOTE_URL" > "$REMOTE_FILE"
elif [ -f "$REMOTE_FILE" ]; then
  REMOTE_URL="$(cat "$REMOTE_FILE" | tr -d '\r\n')"
fi

if [ -z "$REMOTE_URL" ]; then
  echo "💡 尚未設定目標 GitHub Repo 網址。"
  read -r -p "請輸入遠端 Repo URL (例如 https://github.com/<your-username>/ntu-course-calendar.git): " REMOTE_URL
  if [ -n "$REMOTE_URL" ]; then
    echo "$REMOTE_URL" > "$REMOTE_FILE"
  else
    echo "❌ 錯誤: 必須提供遠端 Repo URL！"
    exit 1
  fi
fi

echo "=================================================="
echo "🚀 準備推送至獨立 Repo:"
echo "   目標: $REMOTE_URL"
echo "   訊息: $COMMENT"
echo "=================================================="

# 3. 判斷是否為獨立 git 倉庫或使用隔離 git
if [ -d ".git" ]; then
  # 若本目錄本身已是標準 git 倉庫
  git add -A
  git commit -m "$COMMENT" || echo "⚠️ 沒有需要提交的變更。"
  git remote set-url origin "$REMOTE_URL" 2>/dev/null || git remote add origin "$REMOTE_URL"
  git branch -M main
  git push -u origin main
else
  # 處於父專案子目錄中，使用隔離的 .standalone_git 避免與父專案 git 衝突
  export GIT_DIR="$SCRIPT_DIR/.standalone_git"
  export GIT_WORK_TREE="$SCRIPT_DIR"

  if [ ! -d "$GIT_DIR" ]; then
    echo "📦 初始化獨立 Git 環境..."
    git init -b main
    git remote add origin "$REMOTE_URL"
  else
    git remote set-url origin "$REMOTE_URL" 2>/dev/null || git remote add origin "$REMOTE_URL"
  fi

  git add -A
  git commit -m "$COMMENT" || echo "⚠️ 沒有需要提交的變更。"
  git branch -M main
  git push -u origin main
fi

echo "=================================================="
echo "🎉 推送成功！已同步至 $REMOTE_URL"
echo "=================================================="
