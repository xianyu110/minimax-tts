import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../../src/lib/utils/logger.js';

const logger = createLogger('VideoRenderer');

/**
 * Progress callback type for rendering
 */
export interface RenderProgress {
  frame?: number;
  totalFrames?: number;
  percent?: number;
  renderedFrames?: number;
  fps?: number;
  step?: string;
}

export type ProgressCallback = (progress: RenderProgress) => void;

/**
 * Render options
 */
export interface RenderOptions {
  compositionId?: string;
  codec?: 'h264' | 'h265' | 'prores' | 'vp8' | 'vp9' | 'gif';
  quality?: number;
  audioBitrate?: string;
  frameRate?: number;
  concurrency?: number;
  mute?: boolean;
  overwrite?: boolean;
  progressCallback?: ProgressCallback;
}

/**
 * Video renderer service
 *
 * Renders videos using Remotion CLI
 */
export class VideoRenderer {
  private readonly remotionDir: string;
  private readonly defaultOptions: Required<Omit<RenderOptions, 'progressCallback'>>;

  constructor() {
    this.remotionDir = path.join(process.cwd(), 'remotion');
    this.defaultOptions = {
      compositionId: 'WireframeVideo',
      codec: 'h264',
      quality: 90,
      audioBitrate: '192k',
      frameRate: 30,
      concurrency: null as any,
      mute: false,
      overwrite: true,
    };
  }

  /**
   * Render a video using Remotion CLI
   *
   * @param scenesDataPath - Path to scenes data file (relative to remotion/src)
   * @param audioPath - Path to audio file (relative to remotion/public or absolute)
   * @param outputPath - Output video file path (relative to output/videos)
   * @param options - Additional render options
   * @returns Path to the rendered video
   */
  async renderVideo(
    scenesDataPath: string,
    audioPath: string,
    outputPath: string,
    options: RenderOptions = {}
  ): Promise<string> {
    const renderOptions = { ...this.defaultOptions, ...options };

    logger.info('Starting video render', {
      scenesDataPath,
      audioPath,
      outputPath,
      options: renderOptions,
    });

    // Validate inputs
    await this.validateInputs(scenesDataPath, audioPath);

    // Ensure output directory exists
    const absoluteOutputPath = path.join(process.cwd(), outputPath);
    const outputDir = path.dirname(absoluteOutputPath);
    await this.ensureDirectory(outputDir);

    // Prepare Remotion CLI command
    const args = this.buildRenderCommand(
      renderOptions.compositionId,
      absoluteOutputPath,
      renderOptions
    );

    logger.info('Executing Remotion CLI', { command: `npx remotion render ${args.join(' ')}` });

    // Execute command
    const result = await this.executeRemotionCommand(args, renderOptions.progressCallback);

    if (result.success) {
      logger.info('Video render completed successfully', {
        outputPath: absoluteOutputPath,
        duration: result.duration,
      });
      return absoluteOutputPath;
    } else {
      logger.error('Video render failed', {
        error: result.error,
        stderr: result.stderr,
      });
      throw new Error(`Video render failed: ${result.error}`);
    }
  }

  /**
   * Validate input files
   *
   * @param scenesDataPath - Path to scenes data
   * @param audioPath - Path to audio file
   */
  private async validateInputs(scenesDataPath: string, audioPath: string): Promise<void> {
    // Check if Remotion directory exists
    if (!fs.existsSync(this.remotionDir)) {
      throw new Error(`Remotion directory not found: ${this.remotionDir}`);
    }

    // Check if scenes data file exists
    const absoluteScenesPath = path.isAbsolute(scenesDataPath)
      ? scenesDataPath
      : path.join(process.cwd(), scenesDataPath);

    if (!fs.existsSync(absoluteScenesPath)) {
      throw new Error(`Scenes data file not found: ${absoluteScenesPath}`);
    }

    // Check if audio file exists
    const absoluteAudioPath = path.isAbsolute(audioPath)
      ? audioPath
      : path.join(process.cwd(), audioPath);

    if (!fs.existsSync(absoluteAudioPath)) {
      throw new Error(`Audio file not found: ${absoluteAudioPath}`);
    }
  }

  /**
   * Ensure directory exists
   *
   * @param dir - Directory path
   */
  private async ensureDirectory(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.debug('Created output directory', { dir });
    }
  }

  /**
   * Build Remotion render command arguments
   *
   * @param compositionId - Composition ID to render
   * @param outputPath - Output file path
   * @param options - Render options
   * @returns Array of command arguments
   */
  private buildRenderCommand(
    compositionId: string,
    outputPath: string,
    options: Required<Omit<RenderOptions, 'progressCallback'>>
  ): string[] {
    const args: string[] = [
      'render',
      compositionId,
      outputPath,
      `--codec=${options.codec}`,
      `--sequence-frame=0`,
    ];

    if (options.quality !== undefined) {
      args.push(`--quality=${options.quality}`);
    }

    if (options.audioBitrate) {
      args.push(`--audio-bitrate=${options.audioBitrate}`);
    }

    if (options.frameRate) {
      args.push(`--fps=${options.frameRate}`);
    }

    if (options.concurrency) {
      args.push(`--concurrency=${options.concurrency}`);
    }

    if (options.mute) {
      args.push('--mute');
    }

    if (options.overwrite) {
      args.push('--overwrite');
    }

    return args;
  }

  /**
   * Execute Remotion command with progress monitoring
   *
   * @param args - Command arguments
   * @param progressCallback - Progress callback
   * @returns Command result
   */
  private executeRemotionCommand(
    args: string[],
    progressCallback?: ProgressCallback
  ): Promise<{ success: boolean; error?: string; stdout: string; stderr: string; duration: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const stdout: string[] = [];
      const stderr: string[] = [];

      logger.debug('Spawning Remotion process', { args });

      const childProcess = spawn('npx', ['remotion', ...args], {
        cwd: this.remotionDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          REMOTION_LOG_LEVEL: 'info',
        },
      });

      // Handle stdout
      childProcess.stdout?.on('data', (data) => {
        const text = data.toString('utf-8');
        stdout.push(text);
        logger.debug('Remotion stdout', { text: text.trim() });

        // Parse progress from stdout
        if (progressCallback) {
          const progress = this.parseProgress(text);
          if (progress) {
            progressCallback(progress);
          }
        }
      });

      // Handle stderr
      childProcess.stderr?.on('data', (data) => {
        const text = data.toString('utf-8');
        stderr.push(text);
        logger.debug('Remotion stderr', { text: text.trim() });

        // Some progress info comes through stderr
        if (progressCallback) {
          const progress = this.parseProgress(text);
          if (progress) {
            progressCallback(progress);
          }
        }
      });

      // Handle process exit
      childProcess.on('exit', (code, signal) => {
        const duration = Date.now() - startTime;
        const stdoutText = stdout.join('');
        const stderrText = stderr.join('');

        if (code === 0) {
          resolve({
            success: true,
            stdout: stdoutText,
            stderr: stderrText,
            duration,
          });
        } else {
          resolve({
            success: false,
            error: signal
              ? `Process terminated by signal: ${signal}`
              : `Process exited with code: ${code}`,
            stdout: stdoutText,
            stderr: stderrText,
            duration,
          });
        }
      });

      // Handle process error
      childProcess.on('error', (error) => {
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          error: error.message,
          stdout: stdout.join(''),
          stderr: stderr.join(''),
          duration,
        });
      });
    });
  }

  /**
   * Parse progress information from Remotion output
   *
   * @param text - Output text
   * @returns Progress information or undefined
   */
  private parseProgress(text: string): RenderProgress | undefined {
    // Look for frame progress: "[123/900]"
    const frameMatch = text.match(/\[(\d+)\/(\d+)\]/);
    if (frameMatch) {
      const frame = parseInt(frameMatch[1], 10);
      const totalFrames = parseInt(frameMatch[2], 10);
      return {
        frame,
        totalFrames,
        percent: (frame / totalFrames) * 100,
      };
    }

    // Look for percentage: "45%"
    const percentMatch = text.match(/(\d+)%/);
    if (percentMatch) {
      return {
        percent: parseInt(percentMatch[1], 10),
      };
    }

    // Look for step information
    const stepPatterns = [
      /Bundling/i,
      /Rendering/i,
      /Encoding/i,
      /Stitching/i,
      /Finalizing/i,
    ];

    for (const pattern of stepPatterns) {
      if (pattern.test(text)) {
        return {
          step: pattern.source.replace(/[\/i]/g, ''),
        };
      }
    }

    return undefined;
  }

  /**
   * Render video with retry logic
   *
   * @param scenesDataPath - Path to scenes data
   * @param audioPath - Path to audio file
   * @param outputPath - Output video path
   * @param options - Render options
   * @param maxRetries - Maximum number of retries
   * @returns Path to rendered video
   */
  async renderVideoWithRetry(
    scenesDataPath: string,
    audioPath: string,
    outputPath: string,
    options: RenderOptions = {},
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Render attempt ${attempt}/${maxRetries}`);
        return await this.renderVideo(scenesDataPath, audioPath, outputPath, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Render attempt ${attempt} failed`, { error: lastError.message });

        if (attempt < maxRetries) {
          // Exponential backoff: 2^attempt seconds
          const delaySeconds = Math.pow(2, attempt);
          logger.info(`Retrying in ${delaySeconds} seconds...`);
          await this.sleep(delaySeconds * 1000);
        }
      }
    }

    throw lastError || new Error('Video render failed after maximum retries');
  }

  /**
   * Sleep for a specified duration
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if Remotion is installed and available
   *
   * @returns true if Remotion is available
   */
  async isRemotionAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const childProcess = spawn('npx', ['remotion', '--version'], {
        cwd: this.remotionDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let found = false;

      childProcess.stdout?.on('data', () => {
        found = true;
      });

      childProcess.on('exit', (code) => {
        resolve(code === 0 || found);
      });

      childProcess.on('error', () => {
        resolve(false);
      });
    });
  }
}

/**
 * Export singleton instance
 */
export const videoRenderer = new VideoRenderer();
