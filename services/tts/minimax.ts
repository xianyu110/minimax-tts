import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const FAL_API_URL = 'https://queue.fal.run/fal-ai/minimax-voice-cloning';
const FAL_KEY = process.env.FAL_KEY || '';
const OUTPUT_DIR = path.join(process.cwd(), 'output', 'audio');

export interface TTSOptions {
  voice_id?: string;
  speed?: number;
}

export interface TTSResponse {
  audio_url: string;
  duration: number;
}

class MiniMaxTTS {
  private readonly defaultVoiceId: string;
  private readonly defaultSpeed: number = 1.15;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000;

  constructor(defaultVoiceId: string = 'z0000000425') {
    this.defaultVoiceId = defaultVoiceId;
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!existsSync(OUTPUT_DIR)) {
      fs.mkdir(OUTPUT_DIR, { recursive: true }).catch((err) => {
        console.error('Failed to create output directory:', err);
      });
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Call fal.ai API to generate audio
   */
  private async callFalAPI(
    text: string,
    voiceId: string,
    speed: number
  ): Promise<TTSResponse> {
    if (!FAL_KEY) {
      throw new Error('FAL_KEY environment variable is not set');
    }

    const payload = {
      text,
      voice_id: voiceId,
      speed,
    };

    const response = await axios.post(FAL_API_URL, payload, {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    return response.data;
  }

  /**
   * Poll for task completion
   */
  private async pollForResult(requestId: string): Promise<TTSResponse> {
    const statusUrl = `https://queue.fal.run/fal-ai/minimax-voice-cloning/requests/${requestId}/status`;

    while (true) {
      const response = await axios.get(statusUrl, {
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
        },
      });

      const status = response.data.status;

      if (status === 'COMPLETED') {
        return response.data.result;
      }

      if (status === 'FAILED') {
        throw new Error(`TTS generation failed: ${JSON.stringify(response.data.error)}`);
      }

      if (status === 'IN_PROGRESS' || status === 'IN_QUEUE') {
        await this.sleep(1000);
      } else {
        throw new Error(`Unknown status: ${status}`);
      }
    }
  }

  /**
   * Download audio from URL and save to local file
   */
  private async downloadAudio(url: string, filePath: string): Promise<void> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    await fs.writeFile(filePath, response.data);
  }

  /**
   * Generate audio file from text
   */
  async generateAudio(text: string, options: TTSOptions = {}): Promise<string> {
    const voiceId = options.voice_id || this.defaultVoiceId;
    const speed = options.speed ?? this.defaultSpeed;

    // Validate inputs
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (speed < 0.5 || speed > 2.0) {
      throw new Error('Speed must be between 0.5 and 2.0');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Generate timestamp for filename
        const timestamp = Date.now();
        const fileName = `${timestamp}.mp3`;
        const filePath = path.join(OUTPUT_DIR, fileName);

        // Call fal.ai API
        const result = await this.callFalAPI(text, voiceId, speed);

        // If we get a request ID, poll for result
        if (result && typeof result === 'object' && 'request_id' in result) {
          const audioResult = await this.pollForResult((result as any).request_id);
          await this.downloadAudio(audioResult.audio_url, filePath);
        } else if (result && 'audio_url' in result) {
          // Direct result
          await this.downloadAudio(result.audio_url, filePath);
        } else {
          throw new Error('Invalid response from fal.ai API');
        }

        return filePath;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries - 1) {
          console.warn(
            `TTS generation attempt ${attempt + 1} failed, retrying...`,
            lastError.message
          );
          await this.sleep(this.retryDelay * (attempt + 1));
        }
      }
    }

    throw new Error(
      `Failed to generate audio after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Generate multiple audio files from text segments
   */
  async generateBatchAudio(
    texts: string[],
    options: TTSOptions = {}
  ): Promise<string[]> {
    const results: string[] = [];

    for (const text of texts) {
      const filePath = await this.generateAudio(text, options);
      results.push(filePath);
    }

    return results;
  }
}

// Export singleton instance
export const minimaxTTS = new MiniMaxTTS();

// Export class for custom configurations
export { MiniMaxTTS };
