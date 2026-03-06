# V2ET Security Middleware 部署指南

## 📋 部署前准备

### 必需信息

在部署前，请准备以下信息：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `BACKEND_DOMAIN` | V2Board 后端地址 | `https://cs.example.com` |
| `ADMIN_API_PREFIX` | V2Board 后台路径 | `admin` 或 `maoadmin` |
| `ADMIN_EMAIL` | V2Board 管理员邮箱 | `admin@example.com` |
| `ADMIN_PASSWORD` | V2Board 管理员密码 | `your_secure_password` |
| `DISTRIBUTOR_ACCESS_PASSWORD` | 分销商后台访问密码 | `YourAccessPassword123` |

### 获取 V2Board 后台路径

1. 登录你的 V2Board 后台
2. 查看浏览器地址栏 URL
3. 路径即为 `ADMIN_API_PREFIX`

例如：`https://cs.example.com/admin/user` → `ADMIN_API_PREFIX=admin`

---

## Docker Compose 部署（唯一推荐方式）

### 1. 克隆项目

```bash
git clone https://github.com/pkhosn/v2et-security-middleware
cd v2et-security-middleware
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
vim .env
```

**必填配置：**
```bash
# 服务端口
PORT=3001

# V2Board 后端地址（必填）
BACKEND_DOMAIN=https://cs.example.com

# V2Board 后台管理路径（必填）
ADMIN_API_PREFIX=admin

# V2Board 管理员账号（必填）
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password

# 分销商后台访问密码（推荐设置）
DISTRIBUTOR_ACCESS_PASSWORD=YourAccessPassword123
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 验证运行状态

```bash
# 查看日志
docker-compose logs -f

# 检查服务状态
curl http://localhost:3001/api/v1/distributor/status
```

预期响应：
```json
{
  "status": "ok",
  "tokenValid": true,
  "passwordProtected": true,
  "timestamp": 1234567890
}
```

### 5. 常用命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新镜像后重新部署
docker-compose pull
docker-compose up -d
```

---

## Dockerfile（自定义构建）

如果需要自定义镜像：

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 编译 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["node", "dist/index.js"]
```

---

## 🔒 安全加固

### 1. 防火墙配置

**UFW（Ubuntu）：**
```bash
# 只允许特定 IP 访问
ufw allow from 192.168.1.0/24 to any port 3001
ufw enable
```

**iptables：**
```bash
iptables -A INPUT -p tcp --dport 3001 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3001 -j DROP
```

### 2. Nginx 反向代理（HTTPS）

```nginx
server {
    listen 443 ssl;
    server_name middleware.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # IP 白名单
        allow 192.168.1.0/24;
        deny all;
    }
}
```

### 3. 创建专用管理员账号

建议创建一个仅用于分销商兑换的管理员账号：

1. 在 V2Board 后台创建新管理员
2. 仅授予「订单管理」和「用户管理」权限
3. 使用该账号配置中间件

---

## 🩺 故障排查

### 1. 服务无法启动

```bash
# 查看日志
docker-compose logs -f
```

### 2. Token 初始化失败

检查管理员账号配置：
- 确认 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 正确
- 确认 `ADMIN_API_PREFIX` 路径正确
- 测试管理员能否正常登录 V2Board 后台

### 3. 容器重启

```bash
# 查看容器状态
docker-compose ps

# 重启容器
docker-compose restart

# 重新构建
docker-compose down
docker-compose up -d --build
```

---

## 📝 检查清单

部署完成后请确认：

- [ ] `.env` 文件未提交到 Git（`git status` 不显示）
- [ ] 服务状态接口返回正常（`/api/v1/distributor/status`）
- [ ] 管理员 Token 初始化成功（日志显示 `SUCCESS`）
- [ ] 防火墙已配置，只允许信任 IP 访问
- [ ] 生产环境使用 HTTPS
- [ ] 已备份 `.env` 配置文件

---

## 🆘 需要帮助？

遇到问题请提供：
1. Docker 日志（`docker-compose logs`）
2. 错误信息
3. V2Board 版本

祝部署顺利！🚀
