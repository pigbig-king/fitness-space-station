#!/usr/bin/env bash
# 健身空间站 · 一键部署脚本（Ubuntu 22.04 + Docker Compose）
# 用法：bash deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> [1/7] 检查 Docker"
if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 Docker，请先安装：curl -fsSL https://get.docker.com | sh"
  exit 1
fi
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "未检测到 docker compose，请安装 docker-compose-plugin"
  exit 1
fi
echo "    使用：$DC"

echo "==> [2/7] 检查环境变量"
if [ ! -f .env.production ]; then
  echo "缺少 .env.production，请先执行："
  echo "  cp .env.production.example .env.production && nano .env.production"
  exit 1
fi

echo "==> [3/7] 创建数据目录"
mkdir -p data/pgdata data/meili data/uploads data/web-dist

echo "==> [4/7] 构建前端静态产物"
if command -v node >/dev/null 2>&1 && command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile
  pnpm --filter web build
  rm -rf data/web-dist
  cp -r apps/web/dist data/web-dist
  echo "    前端产物已同步到 data/web-dist"
else
  echo "    未检测到 node/pnpm，跳过本地构建。"
  echo "    方案A：本机安装 node 20+ 与 pnpm 后重跑本脚本"
  echo "    方案B：在本地电脑执行 pnpm --filter web build 后上传 apps/web/dist 到 data/web-dist"
  if [ -z "$(ls -A data/web-dist 2>/dev/null || true)" ]; then
    echo "    警告：data/web-dist 为空，前端将 404"
  fi
fi

echo "==> [5/7] 构建后端镜像"
$DC --env-file .env.production build api

echo "==> [6/7] 启动全部服务"
$DC --env-file .env.production up -d

echo "==> [7/7] 等待服务就绪"
sleep 15
echo "--- 容器状态 ---"
$DC --env-file .env.production ps

PUBLIC_IP="$(curl -s --max-time 5 https://api.ipify.org || echo '<服务器IP>')"
echo ""
echo "=========================================="
echo " 部署完成！"
echo " 访问地址：http://${PUBLIC_IP}/"
echo " 健康检查：http://${PUBLIC_IP}/api"
echo " 查看日志：$DC logs -f api"
echo "=========================================="
