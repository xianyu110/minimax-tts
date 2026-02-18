#!/usr/bin/env tsx
/**
 * CLI 入口脚本：创建视频
 *
 * 使用方式：
 *   tsx scripts/create-video.ts "选题标题"
 *   tsx scripts/create-video.ts "选题标题" --voice-id "z0000000425" --speed 1.15
 *   tsx scripts/create-video.ts "选题标题" --output-dir "./output/my-videos"
 */

import * as path from 'path';
import { parseArgs } from 'util';
import { createVideo } from '../agents/moubi/index.js';
import { createLogger, LogLevel } from '../src/lib/utils/logger.js';

const logger = createLogger('CreateVideoCLI');

interface CliOptions {
  topic: string;
  voiceId?: string;
  speed?: number;
  outputDir?: string;
  logLevel?: string;
}

/**
 * 解析命令行参数
 */
function parseArgsToOptions(): CliOptions {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'voice-id': {
        type: 'string',
        description: 'Voice ID for TTS',
      },
      speed: {
        type: 'string',
        description: 'Speech speed (0.5 - 2.0)',
      },
      'output-dir': {
        type: 'string',
        description: 'Output directory for video',
      },
      'log-level': {
        type: 'string',
        description: 'Log level (DEBUG, INFO, WARN, ERROR)',
      },
    },
    allowPositionals: true,
  });

  const topic = positionals[0];
  if (!topic) {
    throw new Error('Topic is required. Usage: tsx scripts/create-video.ts "选题标题"');
  }

  return {
    topic,
    voiceId: values['voice-id'],
    speed: values.speed ? parseFloat(values.speed) : undefined,
    outputDir: values['output-dir'],
    logLevel: values['log-level'],
  };
}

/**
 * 格式化进度信息
 */
function formatProgress(step: string, progress: number, message: string): string {
  const progressBar = '[' + '='.repeat(Math.floor(progress / 5)) + ' '.repeat(20 - Math.floor(progress / 5)) + ']';
  return `${progressBar} ${progress}% [${step}] ${message}`;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // 解析参数
    const cliOptions = parseArgsToOptions();

    // 设置日志级别
    if (cliOptions.logLevel) {
      const logLevel = LogLevel[cliOptions.logLevel.toUpperCase() as keyof typeof LogLevel];
      if (logLevel !== undefined) {
        logger.setLevel(logLevel);
      }
    }

    console.log('='.repeat(60));
    console.log('墨笔 Agent - 视频创建工具');
    console.log('='.repeat(60));
    console.log();
    console.log(`选题: ${cliOptions.topic}`);
    if (cliOptions.voiceId) {
      console.log(`语音 ID: ${cliOptions.voiceId}`);
    }
    if (cliOptions.speed) {
      console.log(`语速: ${cliOptions.speed}x`);
    }
    if (cliOptions.outputDir) {
      console.log(`输出目录: ${cliOptions.outputDir}`);
    }
    console.log();
    console.log('开始创建视频...');
    console.log();

    // 创建视频
    const result: VideoCreationResult = await createVideo(cliOptions.topic, {
      voiceId: cliOptions.voiceId,
      speed: cliOptions.speed,
      outputDir: cliOptions.outputDir,
      onProgress: (info) => {
        console.log(formatProgress(info.step, info.progress, info.message));
      },
    });

    console.log();
    console.log('='.repeat(60));

    if (result.success) {
      console.log('视频创建成功！');
      console.log();
      console.log(`视频路径: ${result.videoPath}`);
      console.log(`音频路径: ${result.audioPath}`);
      console.log(`脚本路径: ${result.scriptPath}`);
      console.log(`时间戳路径: ${result.timestampsPath}`);
      console.log(`场景路径: ${result.scenesPath}`);
      console.log(`时长: ${result.duration?.toFixed(2)} 秒`);

      process.exit(0);
    } else {
      console.log('视频创建失败！');
      console.log();
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
  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  }
}

// 运行主函数
main().catch((error) => {
  console.error('主程序异常:', error);
  process.exit(1);
});
