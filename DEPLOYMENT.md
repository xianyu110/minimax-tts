# 部署文档

本文档说明如何在不同环境中部署和配置 AI 视频自动化生产系统。

## 目录

- [本地开发环境开发](#本地开发环境设置)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [环境变量配置](#环境变量配置)
- [依赖服务配置](#依赖服务配置)
- [监控与日志](#监控与日志)

## 本地开发环境设置

### 前置要求

- Node.js 18+
- npm 9+ 或 pnpm 8+
- Git
- （可选）Docker

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/xianyu110/minimax-tts.git
cd minimax-tts

# 2. 安装依赖
npm install
cd remotion && npm install && cd ..

# 3. 配置环境变量
cp .env.example .env
nano .env

# 4. 编译项目
npm run build

# 5. 运行测试
npm run test:mock
```

### 开发模式运行

```bash
# 使用 tsx 运行（开发模式，支持热重载）
npm run dev

# 或编译后运行
npm run build
npm start
```

### Remotion 开发预览

```bash
cd remotion
npm run dev

# 访问 http://localhost:3000 查看视频预览
```

## 生产环境部署

### 系统要求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核心 | 4+ 核心 |
| 内存 | 4GB | 8GB+ |
| 存储 | 20GB | 50GB+ SSD |
| 操作系统 | Linux/macOS | Ubuntu 22.04 LTS |

### 部署步骤

#### 1. 服务器准备

```bash
# 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 FFmpeg
sudo apt-get install -y ffmpeg

# 安装 Git
sudo apt-get install -y git

# 安装 PM2（进程管理）
npm install -g pm2
```

#### 2. 部署代码

```bash
# 克隆代码
git clone https://github.com/xianyu110/minimax-tts.git
cd minimax-tts

# 安装依赖
npm install --production
cd remotion && npm install --production && cd ..

# 配置环境变量
cp .env.example .env
nano .env  # 填入生产环境配置

# 编译项目
npm run build
```

#### 3. 配置 PM2

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'minimax-tts-api',
      script: 'dist/index.js',
      cwd: '/path/to/minimax-tts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

启动服务：

```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 输出文件访问
    location /output/ {
        alias /path/to/minimax-tts/output/;
        autoindex on;
    }
}
```

```bash
# 安装 Nginx
sudo apt-get install -y nginx

# 创建配置
sudo nano /etc/nginx/sites-available/minimax-tts

# 启用站点
sudo ln -s /etc/nginx/sites-available/minimax-tts /etc/nginx/sites-enabled/

# 重启 Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## Docker 部署

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY remotion/package*.json ./remotion/
RUN npm ci && cd remotion && npm ci && cd ..

# 复制源代码
COPY . .

# 编译
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 安装生产依赖和 FFmpeg
RUN apk add --no-cache ffmpeg
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/remotion/package*.json ./remotion/
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/remotion/node_modules ./remotion/node_modules

# 创建输出目录
RUN mkdir -p output/audio output/videos

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: minimax-tts
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - FAL_KEY=${FAL_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
    volumes:
      - ./output:/app/output
      - ./logs:/app/logs
    networks:
      - minimax-network

  nginx:
    image: nginx:alpine
    container_name: minimax-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./output:/app/output:ro
    depends_on:
      - app
    networks:
      - minimax-network

networks:
  minimax-network:
    driver: bridge
```

### 构建和运行

```bash
# 构建镜像
docker-compose build

# 首次运行（创建 .env 文件）
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

## 环境变量配置

### 必需环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API Key，用于 Claude 调用 | [console.anthropic.com](https://console.anthropic.com) |
| `OPENAI_API_KEY` | OpenAI API Key，用于 Whisper 服务 | [platform.openai.com](https://platform.openai.com) |
| `FAL_KEY` | Fal.ai API Key，用于 TTS 服务 | [fal.ai](https://fal.ai) |

### 可选环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|-------|
| `NODE_ENV` | 运行环境 | `development` |
| `LOG_LEVEL` | 日志级别 | `INFO` |
| `PORT` | 服务端口 | `3000` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | - |
| `TELEGRAM_CHAT_ID` | Telegram 授权用户 ID | - |

### .env 文件示例

```env
# API 密钥（必需）
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
FAL_KEY=fal_xxxxxxxxxxxxxxxx

# Telegram 配置（可选）
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxxxxxx
TELEGRAM_CHAT_ID=xxxxxxxxxxxxxxxx

# 应用配置
NODE_ENV=production
LOG_LEVEL=INFO
PORT=3000

# 服务配置
TTS_DEFAULT_VOICE_ID=z0000000425
TTS_DEFAULT_SPEED=1.15
TTS_MAX_RETRIES=3

# Whisper 配置
WHISPER_MODEL=whisper-1
WHISPER_MAX_RETRIES=3

# Remotion 配置
REMOTION_PORT=3000
REMOTION_CODEC=h264
REMOTION_FRAMERATE=30
REMOTION_HEIGHT=1920
REMOTION_WIDTH=1080
```

## 依赖服务配置

### Anthropic Claude

#### 配置说明

- **用途**: 脚本生成和选题生成
- **API 地址**: https://api.anthropic.com
- **模型**: claude-opus-4-6

#### 配置示例

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
});
```

### OpenAI Whisper

#### 配置说明

- **用途**: 音频时间戳提取
- **API 地址**: https://api.openai.com/v1
- **模型**: whisper-1

#### 配置示例

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});
```

### Fal.ai (MiniMax TTS)

#### 配置说明

- **用途**: 语音克隆和生成
- **API 地址**: https://queue.fal.run
- **模型**: fal-ai/minimax-voice-cloning

#### 配置示例

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://queue.fal.run/fal-ai/minimax-voice-cloning',
  headers: {
    'Authorization': `Key ${process.env.FAL_KEY}`,
  },
});
```

## 监控与日志

### 日志配置

项目使用内置的 Logger 工具，支持多级别日志：

```typescript
import { createLogger, LogLevel } from './src/lib/utils/logger.js';

const logger = createLogger('MyService', LogLevel.INFO);

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

### 日志级别

| 级别 | 说明 |
|------|------|
| `DEBUG` | 详细调试信息 |
| `INFO` | 常规信息 |
| `WARN` | 警告信息 |
| `ERROR` | 错误信息 |

### PM2 日志管理

```bash
# 实时查看日志
pm2 logs minimax-tts-api

# 清除日志
pm2 flush

# 查看日志文件位置
pm2 show minimax-tts-api | grep -E "(log file|error log)"
```

### 日志轮转

使用 PM2 日志轮转模块：

```bash
# 安装
pm2 install pm2-logrotate

# 配置（可选）
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 健康检查

创建健康检查端点：

```typescript
import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.listen(process.env.PORT || 3000);
```

## 故障排查

### 常见问题

#### 1. 依赖安装失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 2. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

#### 3. 内存不足

```bash
# 检查内存使用
free -h

# 增加交换空间（Linux）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 4. FFmpeg 相关错误

```bash
# 检查 FFmpeg 安装
ffmpeg -version

# 重新安装 FFmpeg
sudo apt-get install --reinstall ffmpeg
```

## 安全建议

1. **环境变量保护**: 确保 `.env` 文件不被提交到版本控制（已在 `.gitignore` 中）
2. **API 密钥管理**: 使用密钥管理服务（如 AWS Secrets Manager）
3. **HTTPS**: 生产环境强制使用 HTTPS
4. **访问控制**: 配置防火墙规则，只开放必要端口
5. **定期更新**: 定期更新依赖包，修复安全漏洞

## 性能优化

1. **并发控制**: 根据服务器配置调整并发任务数
2. **缓存策略**: 对 API 响应实现缓存
3. **CDN 加速**: 将生成的视频上传到 CDN
4. **异步处理**: 使用消息队列处理耗时的视频渲染任务

## 备份策略

```bash
# 备份代码
tar -czf minimax-tts-backup-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='output' \
  /path/to/minimax-tts

# 备份输出文件
tar -czf output-backup-$(date +%Y%m%d).tar.gz \
  /path/to/minimax-tts/output
```

---

如有问题，请提交 [GitHub Issue](https://github.com/xianyu110/minimax-tts/issues)
