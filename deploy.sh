#!/bin/bash
# deploy.sh · 部署 winwin行动 到 GitHub Pages
# 用法：./deploy.sh <GitHub用户名>   （需要已 gh auth login）
set -e
OWNER="${1:?用法: ./deploy.sh <GitHub用户名>}"
REPO="winwin-action"
BRANCH="main"

# 1) 创建远程仓库（已存在则忽略错误）
gh repo create "$OWNER/$REPO" --private --source=. --remote=origin --push 2>/dev/null || { git remote remove origin 2>/dev/null || true; git remote add origin "https://github.com/$OWNER/$REPO.git"; git push -u origin "$BRANCH"; }

# 2) 开启 GitHub Pages（Source = main 分支根目录）
gh api -X POST "repos/$OWNER/$REPO/pages" -f "source[branch]=$BRANCH" -f "source[path]=/" >/dev/null 2>&1 || \
gh api -X PUT  "repos/$OWNER/$REPO/pages" -f "source[branch]=$BRANCH" -f "source[path]=/" >/dev/null 2>&1 || true

# 3) 输出链接
echo "✅ 部署指令已提交。新链接：https://$OWNER.github.io/$REPO/"
echo "（GitHub Pages 首次启用通常 1-3 分钟生效；后续 push 即自动更新）"
