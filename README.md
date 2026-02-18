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
Remotion 渲染 MP
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

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.8+（用于 Whisper）
- 服务器（推荐 4C8G 以上）

### 安装

```bash
# 克隆仓库
git clone https://github.com/xianyu110/minimax-tts.git
cd minimax-tts

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 API 密钥
```

### 渲染视频

```bash
npx remotion render WireframeVideo out/成片.mp4 --codec=h264
```

## 成本对比

| 项目 | 传统外包 | AI 自动化 |
|-----|---------|----------|
| 制作时间 | 2-3 小时 | 15 分钟 |
| 单条成本 | 300-800 元 | 0.1 元元 |
| 平均播放量 | 200 | 1595 |

## 文档

- [产品需求文档 (PRD)](./PRD_AI视频自动化生产系统.md) - 完整的产品需求与设计方案

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

**核心公式：视频 = 数据 + 模板 + 自动化**
