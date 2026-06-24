#!/bin/bash
# ==================================
#  小牛育儿 30天宣传指挥台 启动脚本
#  用法: 双击此文件，或在终端执行 ./start.sh
# ==================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../backend" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  ╔══════════════════════════════════╗"
echo "  ║   小牛育儿 30天宣传指挥台       ║"
echo "  ║   看懂孩子短板，带娃更省心       ║"
echo "  ╚══════════════════════════════════╝"
echo -e "${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js${NC}"
    echo "下载地址: https://nodejs.org"
    read -p "按回车键退出..."
    exit 1
fi

# Check npm dependencies
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}首次启动，正在安装依赖...${NC}"
    cd "$BACKEND_DIR"
    npm install
    cd "$SCRIPT_DIR"
fi

# Check .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}错误: 未找到 $BACKEND_DIR/.env${NC}"
    echo "请先配置 .env 文件（必需项: AI_PROVIDER, AI_API_KEY, AI_MODEL）"
    read -p "按回车键退出..."
    exit 1
fi

# Kill existing process on port 3002
if command -v lsof &> /dev/null; then
    EXISTING_PID=$(lsof -ti:3002 2>/dev/null)
    if [ -n "$EXISTING_PID" ]; then
        echo -e "${YELLOW}端口 3002 已被占用，正在关闭...${NC}"
        kill -9 $EXISTING_PID 2>/dev/null
        sleep 2
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp | grep -q ':3002'; then
        echo -e "${YELLOW}端口 3002 已被占用${NC}"
        PID=$(ss -tlnp | grep ':3002' | grep -oP 'pid=\K\d+')
        kill -9 $PID 2>/dev/null
        sleep 2
    fi
fi

echo -e "${GREEN}启动后端服务 (端口 3002)...${NC}"
NODE_PATH="$BACKEND_DIR/node_modules:/usr/local/lib/node_modules" \
    node "$BACKEND_DIR/src/mysql-production/server.js" &
BACKEND_PID=$!

# Wait for backend to be ready
echo -n "等待后端就绪"
for i in $(seq 1 30); do
    if curl -s http://127.0.0.1:3002/health > /dev/null 2>&1; then
        echo -e " ${GREEN}OK${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Check if backend actually started
if ! curl -s http://127.0.0.1:3002/health > /dev/null 2>&1; then
    echo ""
    echo -e "${RED}后端启动失败，请检查 $BACKEND_DIR/.env 配置${NC}"
    kill $BACKEND_PID 2>/dev/null
    read -p "按回车键退出..."
    exit 1
fi

echo ""
echo -e "${GREEN}  后端服务: http://127.0.0.1:3002${NC}"
echo -e "${GREEN}  指挥台:   http://127.0.0.1:3002/marketing/${NC}"
echo ""
echo -e "${YELLOW}  按 Ctrl+C 停止所有服务${NC}"
echo ""

# Open browser
OPEN_URL="http://127.0.0.1:3002/marketing/"
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$OPEN_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    (xdg-open "$OPEN_URL" 2>/dev/null || sensible-browser "$OPEN_URL" 2>/dev/null || echo "请手动打开: $OPEN_URL") &
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start "$OPEN_URL"
fi

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}正在关闭服务...${NC}"
    kill $BACKEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}已关闭${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
