#!/usr/bin/env tsx
/**
 * 墨笔 Agent 测试脚本
 *
 * 用于测试墨笔 Agent 的各个功能模块
 */

import { createVideo } from '../agents/moubi/index.js';

async function testMoubiAgent(): Promise<void> {
  console.log('='.repeat(60));
  console.log('墨笔 Agent 测试');
  console.log('='.repeat(60));
  console.log();

  // 测试视频创建流程
  const testTopic = 'AI 如何改变软件开发';

  console.log(`测试选题: ${testTopic}`);
  console.log();

  const result = await createVideo(testTopic, {
    voiceId: process.env.FAL_VOICE_ID || 'z0000000425',
    speed: 1.15,
    onProgress: (info) => {
      const progressBar = '[' + '='.repeat(Math.floor(info.progress / 5)) + ' '.repeat(20 - Math.floor(info.progress / 5)) + ']';
      console.log(`${progressBar} ${info.progress}% [${info.step}] ${info.message}`);
    },
  });

  console.log();
  console.log('='.repeat(60));

  if (result.success) {
    console.log('测试成功！');
    console.log(`视频路径: ${result.videoPath}`);
    console.log(`音频路径: ${result.audioPath}`);
    console.log(`脚本路径: ${result.scriptPath}`);
    console.log(`时间戳路径: ${result.timestampsPath}`);
    console.log(`场景路径: ${result.scenesPath}`);
    console.log(`时长: ${result.duration?.toFixed(2)} 秒`);
  } else {
    console.log('测试失败！');
    console.log(`错误: ${result.error}`);
    console.log();
    console.log('日志:');
    if (result.logs) {
      for (const log of result.logs) {
        console.log(`  ${log}`);
      }
    }
    process.exit(1);
  }
}

// 运行测试
testMoubiAgent().catch((error) => {
  console.error('测试异常:', error);
  process.exit(1);
});
