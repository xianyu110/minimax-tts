# 使用示例

本文档提供 AI 视频自动化生产系统的详细使用示例和最佳实践。

## 目录

- [基础示例](#基础示例)
- [端到端流程](#端到端流程)
- [高级用法](#高级用法)
- [最佳实践](#最佳实践)

## 基础示例

### 1. 生成选题（TopicGenerator）

使用墨媒 Agent 生成视频选题：

```typescript
import { TopicGenerator } from '../agents/momo/topic-generator.js';

// 创建生成器实例
const generator = new TopicGenerator();

// 生成 5 个选题
const topicList = await generator.generateTopics(5);

// 输出结果
console.log('生成的选题：');
topicList.topics.forEach((topic, index) => {
  console.log(`${index + 1}. ${topic.title}`);
  console.log(`   描述: ${topic.description}`);
  console.log(`   分类: ${topic.category}`);
  console.log(`   ID: ${topic.id}`);
});
```

**输出示例：**

```
生成的选题：
1. AI 编程助手
   描述: 如何用 AI 提高编程效率
   分类: AI工具
   ID: topic-1234567890-abc123
2. VS Code 技巧
   描述: 10 个实用的编辑器技巧
   分类: 效率提升
   ...
```

### 2. 生成脚本（ScriptGenerator）

使用墨笔 Agent 生成视频脚本：

```typescript
import { ScriptGenerator } from '../agents/moubi/script-generator.js';

// 创建脚本生成器
const generator = new ScriptGenerator();

// 生成脚本
const script = await generator.generateScript({
  topic: '前端性能优化',
});

// 输出结果
console.log('完整脚本：');
console.log(script.script);

console.log('\n关键词高亮：');
script.keywords.forEach(keyword => {
  console.log(`  [${keyword.color}] ${keyword.word}`);
});

console.log('\n脚本分段：');
script.segments.forEach(segment => {
  console.log(`  [${segment.type}] ${segment.text}`);
});
```

**输出示例：**

```
完整脚本：
大家好，今天分享一个让网页加载速度提升 5 倍的技巧。
你是不是经常遇到网页打开很慢的问题？
其实只需要配置一下 CDN 和图片压缩，就能大大提升加载速度。
试试看吧！

关键词高亮：
  [cyan] CDN
  [gold] 5

脚本分段：
  [opening] 大家好，今天分享一个让网页加载速度提升 5 倍的技巧。
  [pain] 你是不是经常遇到网页打开很慢的问题？
  [solution] 其实只需要配置一下 CDN 和图片压缩，就能大大提升加载速度。
  [closing] 试试看吧！
```

### 3. 生成语音（MiniMaxTTS）

使用 MiniMax TTS 服务生成克隆语音：

```typescript
import { MiniMaxTTS } from '../services/tts/minimax.js';

// 创建 TTS 实例
const tts = new MiniMaxTTS('z0000000425'); // 使用默认语音 ID

// 生成单个语音
const audioPath = await tts.generateAudio('这是一段测试语音。', {
  speed: 1.15, // 语速
});

console.log(`音频已生成: ${audioPath}`);

// 批量生成语音
const texts = [
  '这是第一段语音。',
  '这是第二段语音。',
  '这是第三段语音。',
];

const audioPaths = await tts.generateBatchAudio(texts);
console.log(`生成了 ${audioPaths.length} 个音频文件`);
```

### 4. 提取时间戳（WhisperTimestampExtractor）

使用 Whisper 服务提取音频时间戳：

```typescript
import { createWhisperExtractor } from '../src/services/whisper/index.js';

// 创建 Whisper 提取器
const extractor = createWhisperExtractor({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'whisper-1',
});

// 提取时间戳
const segments = await extractor.processAudioFile(
  '/path/to/audio.mp3',
  '/path/to/output/timestamps.json'
);

// 输出结果
segments.forEach(segment => {
  console.log(`[${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s] ${segment.text}`);
});
```

**输出示例：**

```
[0.00s - 2.50s] 大家好，今天分享一个让网页加载速度提升 5 倍的技巧。
[2.50s - 5.00s] 你是不是经常遇到网页打开很慢的问题？
[5.00s - 9.50s] 其实只需要配置一下 CDN 和图片压缩，就能大大提升加载速度。
[9.50s - 11.50s] 试试看吧！
```

## 端到端流程

以下是一个完整的端到端示例，从选题生成到视频渲染：

```typescript
import { TopicGenerator } from '../agents/momo/topic-generator.js';
import { ScriptGenerator } from '../agents/moubi/script-generator.js';
import { MiniMaxTTS } from '../services/tts/minimax.js';
import { createWhisperExtractor } from '../src/services/whisper/index.js';
import { createLogger } from '../src/lib/utils/logger.js';

const logger = createLogger('VideoPipeline');

async function createVideo() {
  try {
    // Step 1: 生成选题
    logger.info('Step 1: 生成选题...');
    const topicGenerator = new TopicGenerator();
    const topicList = await topicGenerator.generateTopics(1);
    const topic = topicList.topics[0];
    logger.info(`选题: ${topic.title}`);

    // Step 2: 生成脚本
    logger.info('Step 2: 生成脚本...');
    const scriptGenerator = new ScriptGenerator();
    const script = await scriptGenerator.generateScript({ topic: topic.title });
    logger.info(`脚本: ${script.script.substring(0, 50)}...`);

    // Step 3: 生成语音
    logger.info('Step 3: 生成语音...');
    const tts = new MiniMaxTTS();
    const audioPath = await tts.generateAudio(script.script, {
      voice_id: 'z0000000425',
      speed: 1.15,
    });
    logger.info(`音频已生成: ${audioPath}`);

    // Step 4: 提取时间戳
    logger.info('Step 4: 提取时间戳...');
    const extractor = createWhisperExtractor();
    const segments = await extractor.processAudioFile(audioPath);
    logger.info(`提取了 ${segments.length} 个时间戳段`);

    // Step 5: 场景编排（需要根据时间戳生成场景数据）
    logger.info('Step 5: 场景编排...');
    const scenes = generateScenes(script, segments);
    logger.info(`编排了 ${scenes.length} 个场景`);

    // Step 6: 渲染视频（需要 Remotion）
    logger.info('Step 6: 渲染视频...');
    // const videoPath = await renderVideo(scenes, audioPath);
    logger.info('视频渲染完成');

    return {
      topic,
      script,
      audioPath,
      segments,
      scenes,
      // videoPath,
    };
  } catch (error) {
    logger.error(`视频创建失败: ${error}`);
    throw error;
  }
}

function generateScenes(script: any, segments: any[]) {
  // 简单的场景编排逻辑
  return segments.map((segment, index) => {
    if (index === 0) {
      return {
        start: segment.start,
        end: segment.end,
        type: 'title',
        title: script.segments[0]?.text?.substring(0, 10) || '视频标题',
      };
    } else if (index === 1) {
      return {
        start: segment.start,
        end: segment.end,
        type: 'pain',
        subtitle: segment.text,
      };
    } else if (index < segments.length - 1) {
      return {
        start: segment.start,
        end: segment.end,
        type: 'solution',
        highlight: segment.text,
      };
    } else {
      return {
        start: segment.start,
        end: segment.end,
        type: 'closing',
        xiaomo: 'celebrate',
      };
    }
  });
}

// 运行流程
createVideo()
  .then((result) => {
    logger.info('视频创建流程完成');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    logger.error(`流程失败: ${error}`);
    process.exit(1);
  });
```

## 高级用法

### 1. 自定义 Prompt 模板

```typescript
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 自定义 Prompt
const customPrompt = `
你是一个专业的短视频脚本创作者。

请根据主题 "{{topic}}" 生成一个 60 秒的视频脚本。

要求：
- 口语化表达
- 节奏感强
- 有记忆点

请按以下 JSON 格式输出：
{
  "script": "完整脚本",
  "keywords": [{"word": "关键词", "color": "cyan|gold|red"}],
  "segments": [{"text": "文案", "type": "opening|pain|solution|closing"}]}
`;

async function generateCustomScript(topic: string) {
  const prompt = customPrompt.replace('{{topic}}', topic);

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '';
  return JSON.parse(text);
}
```

### 2. 批量处理

```typescript
import { TopicGenerator } from '../agents/momo/topic-generator.js';
import { ScriptGenerator } from '../agents/moubi/script-generator.js';

async function batchProcess(batchSize: number = 10) {
  const topicGenerator = new TopicGenerator();
  const scriptGenerator = new ScriptGenerator();

  // 批量生成选题
  const topicList = await topicGenerator.generateTopics(batchSize);

  // 并行生成脚本
  const scriptPromises = topicList.topics.map(async (topic) => {
    return {
      topic,
      script: await scriptGenerator.generateScript({ topic: topic.title }),
    };
  });

  const results = await Promise.all(scriptPromises);

  return results;
}
```

### 3. 错误处理和重试

```typescript
import { createLogger } from '../src/lib/utils/logger.js';

const logger = createLogger('RetryHandler');

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Attempt ${attempt + 1} failed: ${lastError.message}`);

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// 使用示例
const script = await withRetry(
  () => scriptGenerator.generateScript({ topic: '测试主题' }),
  3,
  1000
);
```

### 4. 进度监控

```typescript
interface ProgressCallback {
  (step: string, progress: number, total: number): void;
}

async function createVideoWithProgress(
  onProgress: ProgressCallback
) {
  const steps = ['选题生成', '脚本生成', '语音合成', '时间戳提取', '视频渲染'];

  for (let i = 0; i < steps.length; i++) {
    onProgress(steps[i], i + 1, steps.length);

    // 执行对应步骤
    switch (i) {
      case 0:
        await generateTopic();
        break;
      case 1:
        await generateScript();
        break;
      // ... 其他步骤
    }
  }
}

// 使用示例
createVideoWithProgress((step, progress, total) => {
  console.log(`[${progress}/${total}] ${step}`);
  const percentage = (progress / total) * 100;
  updateProgressBar(percentage);
});
```

## 最佳实践

### 1. 环境变量管理

始终使用 `.env` 文件管理敏感信息：

```typescript
import dotenv from 'dotenv';

dotenv.config();

const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  falKey: process.env.FAL_KEY,

  validate() {
    if (!this.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    if (!this.falKey) {
      throw new Error('FAL_KEY is required');
    }
  },
};

config.validate();
```

### 2. 日志记录

使用 logger 记录重要事件：

```typescript
import { createLogger, LogLevel } from '../src/lib/utils/logger.js';

const logger = createLogger('MyService', LogLevel.INFO);

logger.info('开始处理任务');
logger.debug('详细调试信息');
logger.warn('警告信息');
logger.error('错误信息', error);
```

### 3. 输入验证

验证用户输入和 API 响应：

```typescript
function validateTopic(topic: string): void {
  if (!topic || topic.trim().length === 0) {
    throw new Error('Topic cannot be empty');
  }

  if (topic.length > 100) {
    throw new Error('Topic is too long');
  }

  // 检查非法字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(topic)) {
    throw new Error('Topic contains invalid characters');
  }
}
```

### 4. 资源清理

确保文件和资源正确清理：

```typescript
import { unlink } from 'fs/promises';

async function processAudio(audioPath: string) {
  const tempFiles: string[] = [];

  try {
    // 处理音频
    const result = await doProcessing(audioPath);

    // 记录临时文件
    tempFiles.push(result.tempFile);

    return result;
  } finally {
    // 清理临时文件
    for (const file of tempFiles) {
      try {
        await unlink(file);
      } catch (error) {
        console.warn(`Failed to delete ${file}: ${error}`);
      }
    }
  }
}
```

### 5. 性能优化

- 使用缓存避免重复计算
- 批量处理减少 API 调用
- 并行处理独立任务

```typescript
import { LRUCache } from 'lru-cache';

const scriptCache = new LRUCache<string, any>({ max: 100 });

async function getCachedScript(topic: string) {
  if (scriptCache.has(topic)) {
    return scriptCache.get(topic);
  }

  const script = await generateScript(topic);
  scriptCache.set(topic, script);

  return script;
}
```

## 故障排查

### 常见问题

**Q: API 调用失败**

```typescript
try {
  const result = await apiCall();
} catch (error) {
  if (error.response) {
    console.error('API Error:', error.response.status, error.response.data);
  } else {
    console.error('Network Error:', error.message);
  }
}
```

**Q: 文件路径问题**

```typescript
import path from 'path';

const projectRoot = process.cwd();
const audioPath = path.join(projectRoot, 'output', 'audio', 'output.mp3');
```

**Q: 异步处理错误**

```typescript
// 错误方式 - 不捕获错误
results.forEach(async (item) => {
  await processItem(item); // 如果失败，Promise 会静默 reject
});

// 正确方式 - 使用 Promise.all 或 for...of
await Promise.all(results.map(item => processItem(item)));

// 或
for (const item of results) {
  await processItem(item);
}
```

---

更多问题请参考 [README.md](../README.md) 或提交 [GitHub Issue](https://github.com/xianyu110/minimax-tts/issues)
