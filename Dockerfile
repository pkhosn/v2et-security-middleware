FROM node:20-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY src/ ./src/
COPY tsconfig.json ./

# 构建 TypeScript
RUN npm run build

ENV NODE_ENV=production

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["node", "dist/index.js"]
