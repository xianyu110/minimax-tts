# AI 视频自动化生产系统

> 基于 OpenClaw + Remotion + 语音克隆的全自动短视频生产系统

## 简介

这是一个将视频制作从"创作"转变为"生产"的系统。通过 AI Agent 协作、代码化模板、语音克隆技术，实现：

- ⚡ **效率提升**：制作时间从 2-3 小时降至 **15 分钟**（提升 90%）
- 💰 **成本优化**：单条视频成本从 300-800 元降至 **0.1 元**（降低 99.9%）
- 📈 **数据增长**：播放量从平均 200 提升至 **1595**（增长 8 倍）
- 🛠️ **零技能门槛**：无需掌握剪映、PR 等剪辑软件

## 技术栈

| 技术组件 | 用途 |
|---------|------|
| [OpenClaw](https://openclaw.dev) | 多 Agent 调度框架 |
| [Remotion](https://www.remotion.dev) | React 视频框架 |
| MiniMax TTS | 语音克隆服务 |
| Whisper | 音频转录与时间戳提取 |
| React | 视频模板开发 |
| Telegram Bot | 消息通知与交互 |
| Anthropic Claude | AI 内容生成 |

## 核心流程

```
墨媒推选题（cron 每日 9:30）
    ↓ Telegram 推送 5 个选题
用户选一个
    ↓ 选题确认
墨笔写旁白脚本（60秒，200字左右）
    ↓
MiniMax TTS 生成克隆语音
    ↓ 约¥0.1，3秒出结果
Whisper 提取逐句时间戳
    ↓ 本地运行，免费
墨笔编排 scenes-data.ts
    ↓ 按时间戳填场景类型+文案
Remotion 渲染 MP4
    ↓ h264编码，约2分钟
墨笔发成片给用户
    ↓ Telegram 通知
用户确认 → 墨媒发布
```

## Agent 架构

- **墨媒（运营 Agent）**：选题推送、发布管理、数据监控
- **墨笔（创作 Agent）**：脚本创作、TTS 调用、场景编排、视频渲染
- **墨影（设计 Agent）**：封面图设计、配图生成

## 视觉风格 - 赛博线框批注体

- **背景色**：#0A0A0F（深色，不刺眼）
- **主文字**：大字排版，字号 60-80px
- **关键词高亮**：Cyan（技术名词）、Gold（数字）、Red（痛点）
- **IP 角色**：小墨（线条猫）6 种姿态
- **动效类型**：glitch（闪现）、slam（砸入）、draw（画圈）、fade（渐显）

## 环境要求

### 必需环境

- **Node.js**: 18.0 或更高版本
- **npm**: 9.0 或更高版本（或使用 pnpm/yarn）
- **TypeScript**: 5.0+（项目内置）

### 可选环境

- **Python**: 3.8+（如需本地运行 Whisper）
- **FFmpeg**:（系统依赖，用于视频处理）

### 服务器配置（生产环境）

- **CPU**: 4 核心以上
- **内存**: 8GB 以上
- **存储**: 50GB 以上 SSD

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/xianyu110/minimax-tts.git
cd minimax-tts
```

### 2. 安装依赖

```bash
# 安装主项目依赖
npm install

# 安装 Remotion 依赖
cd remotion
npm install
cd ..
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 API 密钥
nano .env  # 或使用你喜欢的编辑器
```

### 4. 验证安装

```bash
# 编译项目
npm run build

# 运行测试脚本
npm run test:mock  # 使用 mock 数据测试
```

## 配置环境变量

在项目根目录的 `.env` 文件中配置以下环境变量：

```env
# Anthropic API Key - 用于脚本生成和选题生成
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# OpenAI API Key - 用于 Whisper 时间戳提取
OPENAI_API_KEY=your_openai_api_key_here

# Fal.ai API Key - 用于 MiniMax 语音克隆
FAL_KEY=your_fal_api_key_here

# 可选：日志级别（DEBUG | INFO | WARN | ERROR）
LOG_LEVEL=INFO

# 可选：Telegram Bot 配置（用于消息通知）
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

### 获取 API 密钥

1. **Anthropic API Key**: 访问 [console.anthropic.com](https://console.anthropic.com)
2. **OpenAI API Key**: 访问 [platform.openai.com](https://platform.openai.com)
3. **Fal.ai API Key**: 访问 [fal.ai](https://fal.ai)

## 快速开始

### 基础使用示例

```typescript
import { generateTopics } from './agents/momo/topic-generator.js';
import { scriptGenerator } from './agents/moubi/script-generator.js';
import { minimaxTTS } from './services/tts/minimax.js';
import { createWhisperExtractor } from './src/services/whisper/index.js';

// 1. 生成选题
const topicList = await generateTopics(5);
console.log('选题:', topicList.topics);

// 2. 生成脚本
const script = await scriptGenerator.generateScript({
  topic: topicList.topics[0].title
});
console.log('脚本:', script.script);

// 3. 生成语音
const audioPath = await minimaxTTS.generateAudio(script.script, {
  voice_id: 'z0000000425',
  speed: 1.15
});
console.log('音频文件:', audioPath);

// 4. 提取时间戳
const extractor = createWhisperExtractor();
const segments = await extractor.processAudioFile(audioPath);
console.log('时间戳:', segments);
```

### 运行测试脚本

```bash
# 使用 mock 数据测试（不调用真实 API）
npm run test:mock

# 使用真实 API 测试（需要配置环境变量）
npm run test:api
```

### 渲染视频

```bash
# 使用 Remotion 渲染视频
cd remotion
npm run render

# 或使用 npx 直接渲染
npx remotion render WireframeVideo ../output/videos/output.mp4 --codec=h264
```

## 目录结构

```
minimax-tts/
├── agents/                 # AI Agent 实现
│   ├── momo/              # 墨媒 - 选题生成
│   │   └── topic-generator.ts
│   └── moubi/             # 墨笔 - 脚本生成
│       └── script-generator.ts
├── services/              # 外部服务集成
│   ├── tts/              # TTS 服务
│   │   └── minimax.ts
│   ├── whisper/          # 音频处理
│   └── storage/          # 存储服务
├── src/                   # 源代码
│   ├── lib/              # 库代码
│   │   ├── types/        # 类型定义
│   │   ├── prompts/      # Prompt 模板
│   │   └── utils/        # 工具函数
│   └── services/         # 服务层实现
│       └── whisper/      # Whisper 服务实现
├── remotion/              # Remotion 视频项目
│   ├── src/              # 视频组件
│   └── Remotion.config.ts
├── output/                # 输出目录
│   ├── audio/            # 生成的音频
│   └── videos/           # 渲染的视频
├── scripts/               # 脚本工具
│   └── test-pipeline.ts  # 集成测试
├── examples/              # 示例代码
│   └── example-usage.md
├── .env.example           # 环境变量模板
├── package.json
└── tsconfig.json
```

## 常见问题

### Q1: 运行时提示出现 "FAL_KEY environment variable is not set"

**A**: 请确保在项目根目录创建了 `.env` 文件，并配置了 `FAL_KEY` 环境变量。

```bash
cp .env.example .env
# 编辑 .env 文件填入你的 Fal.ai API Key
```

### Q2: Whisper API 返回 429 Too Many Requests

**A**: OpenAI API 有速率限制，建议：
1. 使用付费账号提高限额
2. 添加重试逻辑（已内置）
3. 考虑使用本地 Whisper 模型

### Q3: 生成的语音文件路径找不到

**A**: 确保 `output/audio` 目录存在。项目会在首次运行时自动创建，如果没有创建请手动创建：

```bash
mkdir -p output/audio
```

### Q4: Remotion 渲染失败

**A**: 常见原因：
1. FFmpeg 未安装：`brew install ffmpeg` (macOS) 或 `apt-get install ffmpeg` (Linux)
2. 内存不足：建议 4GB 以上可用内存
3. 端口占用：检查 3000 端口是否被占用

### Q5: TypeScript 编译错误

**A**: 运行清理命令并重新安装：

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Q6: 如何使用本地 Whisper 模型？

**A**: 可以使用 `openai-whisper` 本地版本：

```python
# pip install openai-whisper
import whisper
model = whisper.load_model("base")
result = model.transcribe("audio.mp3")
```

## 成本对比

| 项目 | 传统外包 | AI 自动化 |
|-----|---------|----------|
| 制作时间 | 2-3 小时 | 15 分钟 |
| 单条成本 | 300-800 元 | 0.1 元 |
| 平均播放量 | 200 | 1595 |

## 更多文档

- [产品需求文档 (PRD)](./PRD_AI视频自动化生产系统.md) - 完整的产品需求与设计方案
- [部署文档](./DEPLOYMENT.md) - 部署和环境配置指南
- [使用示例](./examples/example-usage.md) - 详细使用示例和最佳实践

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

---

**核心公式：视频 = 数据 + 模板 + 自动化**
