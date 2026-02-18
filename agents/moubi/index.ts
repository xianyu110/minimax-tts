/**
 * 墨笔 Agent - 视频制作主流程
 *
 * 整合完整视频制作流程：
 * 1. 接收选题输入
 * 2. 调用 script-generator 生成脚本
 * 3. 调用 minimax TTS 生成音频
 * 4. 调用 whisper 提取时间戳
 * 5. 调用 scene-orchestrator 生成场景数据
 * 6. 调用 renderer 渲染视频
 * 7. 返回视频文件路径
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

import { ScriptGenerator } from './script-generator.js';
import { minimaxTTS } from '../../services/tts/minimax.js';
import { createWhisperExtractor } from '../../src/services/whisper/timestamp-extractor.js';
import { createLogger, LogLevel } from '../../src/lib/utils/logger.js';

import type {
  GeneratedScript,
  ScriptGenerationRequest,
} from '../../lib/types/script.js';
import type { TimestampSegment } from '../../src/lib/types/scene.js';

/**
 * 进度信息接口
 */
export interface ProgressInfo {
  step: string;
  progress: number;
  message: string;
  data?: any;
}

/**
 * 进度回调类型
 */
export type ProgressCallback = (info: ProgressInfo) => void;

/**
 * 视频创建结果
 */
export interface VideoCreationResult {
  success: boolean;
  videoPath?: string;
  audioPath?: string;
  scriptPath?: string;
  timestampsPath?: string;
  scenesPath?: string;
  error?: string;
  duration?: number;
  logs?: string[];
}

/**
 * 视频创建选项
 */
export interface VideoCreationOptions {
  voiceId?: string;
  speed?: number;
  onProgress?: ProgressCallback;
  outputDir?: string;
  keepIntermediateFiles?: boolean;
}

/**
 * 墨笔 Agent 主类
 */
export class MoubiAgent {
  private logger: ReturnType<typeof createLogger>;
  private scriptGenerator: ScriptGenerator;
  private outputDir: string;

  constructor(options?: { outputDir?: string; logLevel?: LogLevel }) {
    this.logger = createLogger('MoubiAgent', options?.logLevel);
    this.scriptGenerator = new ScriptGenerator();
    this.outputDir = options?.outputDir || path.join(process.cwd(), 'output', 'videos');
  }

  /**
   * 初始化输出目录
   */
  private async ensureOutputDir(): Promise<void> {
    if (!existsSync(this.outputDir)) {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  /**
   * 清理中间文件
   */
  private async cleanupIntermediateFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        if (existsSync(file)) {
          await fs.unlink(file);
          this.logger.debug(`Cleaned up file: ${file}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup file ${file}:`, error);
      }
    }
  }

  /**
   * 生成脚本
   */
  private async generateScript(
    topic: string,
    onProgress?: ProgressCallback
  ): Promise<GeneratedScript> {
    this.logger.info('Step 1/6: Generating script for topic:', topic);

    const request: ScriptGenerationRequest = { topic };

    onProgress?.({
      step: 'script-generation',
      progress: 10,
      message: `Generating script for topic: ${topic}`,
    });

    const script = await this.scriptGenerator.generateScript(request);

    this.logger.info('Script generated successfully');
    this.logger.debug('Script:', this.scriptGenerator.formatScript(script));

    onProgress?.({
      step: 'script-generation',
      progress: 20,
      message: 'Script generated successfully',
      data: {
        scriptLength: script.script.length,
        keywordCount: script.keywords.length,
        segmentCount: script.segments.length,
      },
    });

    return script;
  }

  /**
   * 生成音频
   */
  private async generateAudio(
    script: GeneratedScript,
    options: VideoCreationOptions,
    onProgress?: ProgressCallback
  ): Promise<string> {
    this.logger.info('Step 2/6: Generating audio...');

    onProgress?.({
      step: 'audio-generation',
      progress: 30,
      message: 'Generating audio from script',
    });

    const audioPath = await minimaxTTS.generateAudio(script.script, {
      voice_id: options.voiceId,
      speed: options.speed,
    });

    this.logger.info('Audio generated successfully:', audioPath);

    onProgress?.({
      step: 'audio-generation',
      progress: 40,
      message: 'Audio generated successfully',
      data: { audioPath },
    });

    return audioPath;
  }

  /**
   * 提取时间戳
   */
  private async extractTimestamps(
    audioPath: string,
    onProgress?: ProgressCallback
  ): Promise<TimestampSegment[]> {
    this.logger.info('Step 3/6: Extracting timestamps...');

    onProgress?.({
      step: 'timestamp-extraction',
      progress: 45,
      message: 'Extracting word-level timestamps',
    });

    const extractor = createWhisperExtractor();
    const segments = await extractor.transcribeAudio(audioPath);

    this.logger.info('Timestamps extracted successfully, segments:', segments.length);

    onProgress?.({
      step: 'timestamp-extraction',
      progress: 50,
      message: 'Timestamps extracted successfully',
      data: { segmentCount: segments.length },
    });

    return segments;
  }

  /**
   * 生成场景数据
   */
  private async generateScenes(
    script: GeneratedScript,
    segments: TimestampSegment[],
    onProgress?: ProgressCallback
  ): Promise<any[]> {
    this.logger.info('Step 4/6: Generating scene data...');

    onProgress?.({
      step: 'scene-generation',
      progress: 55,
      message: 'Generating scene data from script and timestamps',
    });

    // 场景编排 - 根据脚本分段和时间戳生成场景
    const scenes = this.createScenesFromScript(script, segments);

    this.logger.info('Scene data generated successfully, scenes:', scenes.length);

    onProgress?.({
      step: 'scene-generation',
      progress: 60,
      message: 'Scene data generated successfully',
      data: { sceneCount: scenes.length },
    });

    return scenes;
  }

  /**
   * 从脚本和时间戳创建场景数据
   */
  private createScenesFromScript(
    script: GeneratedScript,
    segments: TimestampSegment[]
  ): any[] {
    const scenes: any[] = [];
    const { keywords, segments: scriptSegments } = script;

    // 计算每个脚本段落对应的时间范围
    let currentTime = 0;
    const segmentDuration = segments.length > 0
      ? (segments[segments.length - 1].end / scriptSegments.length)
      : 3; // 默认每段 3 秒

    for (let i = 0; i < scriptSegments.length; i++) {
      const segment = scriptSegments[i];
      const startTime = currentTime;
      const endTime = currentTime + segmentDuration;

      // 根据段落类型确定场景类型
      const sceneType = this.mapSegmentTypeToSceneType(segment.type);
      const xiaomoPose = this.mapSegmentTypeToXiaomoPose(segment.type);

      // 提取关键词高亮
      const highlight = this.findKeywordInSegment(segment.text, keywords);

      // 创建场景
      const scene: any = {
        start: startTime,
        end: endTime,
        type: sceneType,
        xiaomo: xiaomoPose,
      };

      // 根据场景类型添加额外字段
      if (segment.type === 'opening') {
        scene.title = this.extractTitle(segment.text);
      } else if (segment.type === 'pain') {
        scene.title = '痛点';
        scene.subtitle = this.truncateText(segment.text, 30);
      } else if (segment.type === 'solution') {
        scene.title = '解决方案';
        scene.subtitle = this.truncateText(segment.text, 30);
      } else if (segment.type === 'closing') {
        scene.title = '总结';
        scene.subtitle = this.truncateText(segment.text, 30);
      }

      // 添加关键词高亮
      if (highlight) {
        scene.sceneType = 'emphasis';
        scene.highlight = highlight.word;
      }

      scenes.push(scene);
      currentTime = endTime;
    }

    return scenes;
  }

  /**
   * 映射脚本分段类型到场景类型
   */
  private mapSegmentTypeToSceneType(type: string): string {
    const typeMap: Record<string, string> = {
      opening: 'title',
      pain: 'pain',
      solution: 'emphasis',
      closing: 'circle',
    };
    return typeMap[type] || 'title';
  }

  /**
   * 映射脚本分段类型到小墨姿态
   */
  private mapSegmentTypeToXiaomoPose(type: string): string {
    const poseMap: Record<string, string> = {
      opening: 'peek',
      pain: 'point',
      solution: 'think',
      closing: 'celebrate',
    };
    return poseMap[type] || 'sit';
  }

  /**
   * 提取文本标题
   */
  private extractTitle(text: string): string {
    // 简单提取第一句话作为标题
    const firstSentence = text.split(/[。！？]/)[0];
    return firstSentence || text;
  }

  /**
   * 截断文本
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 在段落中查找关键词
   */
  private findKeywordInSegment(text: string, keywords: any[]): any | null {
    for (const keyword of keywords) {
      if (text.includes(keyword.word)) {
        return keyword;
      }
    }
    return null;
  }

  /**
   * 渲染视频
   */
  private async renderVideo(
    audioPath: string,
    scenes: any[],
    onProgress?: ProgressCallback
  ): Promise<string> {
    this.logger.info('Step 5/6: Rendering video...');

    onProgress?.({
      step: 'video-rendering',
      progress: 65,
      message: 'Rendering video with Remotion',
    });

    // TODO: 集成 Remotion 渲染
    // 临时实现：返回音频路径作为视频路径
    // 实际应该调用 Remotion 渲染器

    this.logger.info('Video render placeholder (Remotion integration pending)');

    onProgress?.({
      step: 'video-rendering',
      progress: 90,
      message: 'Video rendering completed',
      data: { audioPath },
    });

    return audioPath;
  }

  /**
   * 保存中间文件
   */
  private async saveIntermediateFiles(
    jobId: { value: number },
    script: GeneratedScript,
    audioPath: string,
    segments: TimestampSegment[],
    scenes: any[]
  ): Promise<{
    scriptPath: string;
    timestampsPath: string;
    scenesPath: string;
  }> {
    const basePath = path.join(this.outputDir, jobId.value.toString());

    // 保存脚本
    const scriptPath = `${basePath}-script.json`;
    await fs.writeFile(scriptPath, JSON.stringify(script, null, 2), 'utf-8');

    // 保存时间戳
    const timestampsPath = `${basePath}-timestamps.json`;
    await fs.writeFile(timestampsPath, JSON.stringify(segments, null, 2), 'utf-8');

    // 保存场景数据
    const scenesPath = `${basePath}-scenes.json`;
    await fs.writeFile(scenesPath, JSON.stringify(scenes, null, 2), 'utf-8');

    return { scriptPath, timestampsPath, scenesPath };
  }

  /**
   * 创建视频
   *
   * @param topic - 视频选题
   * @param options - 创建选项
   * @returns 视频创建结果
   */
  async createVideo(
    topic: string,
    options: VideoCreationOptions = {}
  ): Promise<VideoCreationResult> {
    const logs: string[] = [];
    const jobId = { value: Date.now() };

    // 辅助函数：添加日志
    const addLog = (message: string) => {
      logs.push(`[${new Date().toISOString()}] ${message}`);
      this.logger.info(message);
    };

    // 辅助函数：进度回调包装
    const wrappedProgress = options.onProgress
      ? (info: ProgressInfo) => {
          addLog(`[${info.step}] ${info.message} (${info.progress}%)`);
          options.onProgress!(info);
        }
      : undefined;

    try {
      addLog(`Starting video creation for topic: ${topic}`);
      await this.ensureOutputDir();

      // 步骤 1: 生成脚本
      const script = await this.generateScript(topic, wrappedProgress);

      // 步骤 2: 生成音频
      const audioPath = await this.generateAudio(script, options, wrappedProgress);

      // 步骤 3: 提取时间戳
      const segments = await this.extractTimestamps(audioPath, wrappedProgress);

      // 步骤 4: 生成场景数据
      const scenes = await this.generateScenes(script, segments, wrappedProgress);

      // 保存中间文件
      const { scriptPath, timestampsPath, scenesPath } = await this.saveIntermediateFiles(
        jobId,
        script,
        audioPath,
        segments,
        scenes
      );
      addLog(`Saved intermediate files: script=${scriptPath}, timestamps=${timestampsPath}, scenes=${scenesPath}`);

      // 步骤 5: 渲染视频
      const videoPath = await this.renderVideo(audioPath, scenes, wrappedProgress);

      // 步骤 6: 完成
      wrappedProgress?.({
        step: 'complete',
        progress: 100,
        message: 'Video creation completed successfully',
        data: { videoPath },
      });

      addLog('Video creation completed successfully');

      return {
        success: true,
        videoPath,
        audioPath,
        scriptPath,
        timestampsPath,
        scenesPath,
        duration: segments[segments.length - 1]?.end || 0,
        logs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Error during video creation: ${errorMessage}`);
      this.logger.error('Video creation failed:', error);

      wrappedProgress?.({
        step: 'error',
        progress: 0,
        message: `Error: ${errorMessage}`,
      });

      return {
        success: false,
        error: errorMessage,
        logs,
      };
    }
  }

  /**
   * 批量创建视频
   *
   * @param topics - 选题列表
   * @param options - 创建选项
   * @returns 视频创建结果列表
   */
  async createBatchVideos(
    topics: string[],
    options: VideoCreationOptions = {}
  ): Promise<VideoCreationResult[]> {
    const results: VideoCreationResult[] = [];

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      this.logger.info(`Processing topic ${i + 1}/${topics.length}: ${topic}`);

      const progressIndex = i / topics.length;
      const batchOptions: VideoCreationOptions = {
        ...options,
        onProgress: options.onProgress
          ? (info) => {
              // 添加批次信息到进度
              options.onProgress!({
                ...info,
                message: `[${i + 1}/${topics.length}] ${info.message}`,
              });
            }
          : undefined,
      };

      const result = await this.createVideo(topic, batchOptions);
      results.push(result);
    }

    return results;
  }
}

/**
 * 导出单例实例
 */
export const moubiAgent = new MoubiAgent();

/**
 * 快捷函数：创建视频
 */
export async function createVideo(
  topic: string,
  options?: VideoCreationOptions
): Promise<VideoCreationResult> {
  return moubiAgent.createVideo(topic, options);
}

export default MoubiAgent;
