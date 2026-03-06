#!/bin/bash

echo "🔄 重启 V2ET Security Middleware..."

# 进入项目目录
cd /root/.openclaw/workspace/v2et-security-middleware

# 停止旧进程
echo "⏹️  停止旧进程..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# 启动新进程
echo "▶️  启动新进程..."
nohup node dist/index.js > /tmp/middleware.log 2>&1 &

# 等待启动
sleep 2

# 检查状态
if curl -s http://localhost:3001/api/v1/distributor/status > /dev/null; then
    echo "✅ 服务重启成功！"
    echo ""
    echo "📊 服务状态："
    curl -s http://localhost:3001/api/v1/distributor/status | head -c 200
    echo ""
else
    echo "❌ 服务启动失败，请检查日志："
    tail -20 /tmp/middleware.log
fi
