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

## 🚀 快速部署

### 方式一：Docker Compose（推荐）⭐

#### 1. 克隆项目

```bash
# 创建目录
mkdir -p /opt/v2et-security-middleware
cd /opt/v2et-security-middleware

# 克隆代码
git clone https://github.com/pkhosn/v2et-security-middleware .
```

#### 2. 配置环境变量

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

#### 3. 创建 docker-compose.yml

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  middleware:
    image: node:20-alpine
    container_name: v2et-middleware
    working_dir: /app
    volumes:
      - .:/app
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - BACKEND_DOMAIN=${BACKEND_DOMAIN}
      - ADMIN_API_PREFIX=${ADMIN_API_PREFIX}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - DISTRIBUTOR_ACCESS_PASSWORD=${DISTRIBUTOR_ACCESS_PASSWORD}
    command: sh -c "npm install && npm run build && node dist/index.js"
    restart: always
```

#### 4. 启动服务

```bash
# 启动容器
docker-compose up -d

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

#### 5. 常用命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新代码后重新部署
git pull
docker-compose down
docker-compose up -d --build
```

---

### 方式二：Node.js 直接部署（备选）

> ⚠️ 此方式作为备选方案，推荐优先使用 Docker Compose

#### 1. 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

#### 2. 克隆项目

```bash
# 创建目录
mkdir -p /opt/v2et-security-middleware
cd /opt/v2et-security-middleware

# 克隆代码
git clone https://github.com/pkhosn/v2et-security-middleware .
```

#### 3. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
vim .env
```

配置内容同上（Docker Compose 方式）。

#### 4. 安装依赖并运行

```bash
# 安装依赖
npm install

# 编译
npm run build

# 启动服务
npm start
```

#### 5. 后台运行（生产环境）

使用 PM2 管理：

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name v2et-middleware

# 开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs v2et-middleware
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

### 2. 创建专用管理员账号

建议创建一个仅用于分销商兑换的管理员账号：

1. 在 V2Board 后台创建新管理员
2. 仅授予「订单管理」和「用户管理」权限
3. 使用该账号配置中间件

---

## 🩺 故障排查

### 1. 服务无法启动

```bash
# Docker 方式
docker-compose logs -f

# Node.js 方式
pm2 logs v2et-middleware
```

### 2. Token 初始化失败

检查管理员账号配置：
- 确认 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 正确
- 确认 `ADMIN_API_PREFIX` 路径正确
- 测试管理员能否正常登录 V2Board 后台

### 3. 端口被占用

```bash
# 查看占用端口的进程
lsof -ti:3001

# 杀死进程
lsof -ti:3001 | xargs kill -9
```

---

## 📝 检查清单

部署完成后请确认：

- [ ] `.env` 文件未提交到 Git（`git status` 不显示）
- [ ] 服务状态接口返回正常（`/api/v1/distributor/status`）
- [ ] 管理员 Token 初始化成功（日志显示 `SUCCESS`）
- [ ] 防火墙已配置，只允许信任 IP 访问
- [ ] 已备份 `.env` 配置文件

---

## 🆘 需要帮助？

遇到问题请提供：
1. 部署方式（Docker/Node.js）
2. 错误日志
3. V2Board 版本

祝部署顺利！🚀
