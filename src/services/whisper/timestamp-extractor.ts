import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { TimestampSegment, WhisperResponse } from '../../lib/types/scene.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration for the Whisper service
 */
interface WhisperConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Whisper API timestamp extractor service
 * Transcribes audio files and extracts word/sentence-level timestamps
 */
export class WhisperTimestampExtractor {
  private client: AxiosInstance;
  private config: Required<WhisperConfig>;

  constructor(config: WhisperConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'whisper-1',
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Check if an audio file exists and is readable
   */
  private validateAudioFile(audioFilePath: string): void {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    const stats = fs.statSync(audioFilePath);
    if (stats.size === 0) {
      throw new Error(`Audio file is empty: ${audioFilePath}`);
    }

    // Check file size (25MB is OpenAI's limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (stats.size > maxSize) {
      throw new Error(`Audio file exceeds 25MB limit: ${audioFilePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
    }
  }

  /**
   * Transcribe audio file with word-level timestamps
   */
  async transcribeAudio(audioFilePath: string): Promise<TimestampSegment[]> {
    this.validateAudioFile(audioFilePath);

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFilePath));
      formData.append('model', this.config.model);
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'word');

      const response = await this.client.post<WhisperResponse>(
        '/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      return this.extractSegments(response.data);
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Whisper API error (${error.response.status}): ${JSON.stringify(error.response.data)}`
        );
      }
      if (error.request) {
        throw new Error('Whisper API request failed: No response received');
      }
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  /**
   * Extract and merge word-level timestamps into segments
   */
  private extractSegments(response: WhisperResponse): TimestampSegment[] {
    // Prefer word-level timestamps if available
    if (response.words && response.words.length > 0) {
      return this.mergeWordsToSegments(response.words);
    }

    // Fall back to segments if words are not available
    if (response.segments && response.segments.length > 0) {
      return response.segments.map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
      })).filter(seg => seg.text.length > 0);
    }

    // Final fallback: return the whole text as one segment
    return [{
      start: 0,
      end: 0,
      text: response.text,
    }];
  }

  /**
   * Merge word-level timestamps into sentence-level segments
   */
  private mergeWordsToSegments(words: Array<{ word: string; start: number; end: number }>): TimestampSegment[] {
    const segments: TimestampSegment[] = [];
    let currentSegment: string[] = [];
    let segmentStart: number = words[0]?.start ?? 0;

    // Sentence-ending punctuation patterns
    const sentenceEnders = ['.', '!', '?', '。', '！', '？', '\n'];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordText = word.word;

      currentSegment.push(wordText);

      // Check if this word ends a sentence
      const lastChar = wordText.trim().slice(-1);
      if (sentenceEnders.includes(lastChar)) {
        // Create segment
        segments.push({
          start: segmentStart,
          end: word.end,
          text: currentSegment.join(' ').trim(),
        });

        // Reset for next segment
        currentSegment = [];
        segmentStart = words[i + 1]?.start ?? word.end;
      }
    }

    // Add remaining words as a final segment if any
    if (currentSegment.length > 0) {
      const lastWord = words[words.length - 1];
      segments.push({
        start: segmentStart,
        end: lastWord.end,
        text: currentSegment.join(' ').trim(),
      });
    }

    return segments.filter(seg => seg.text.length > 0);
  }

  /**
   * Save segments to JSON file
   */
  async saveSegmentsToJson(segments: TimestampSegment[], outputPath: string): Promise<void> {
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(segments, null, 2), 'utf-8');
  }

  /**
   * Process audio file and save timestamps
   */
  async processAudioFile(audioFilePath: string, outputJsonPath?: string): Promise<TimestampSegment[]> {
    const segments = await this.transcribeAudio(audioFilePath);

    if (outputJsonPath) {
      await this.saveSegmentsToJson(segments, outputJsonPath);
    }

    return segments;
  }
}

/**
 * Factory function to create a WhisperTimestampExtractor instance
 */
export function createWhisperExtractor(config?: Partial<WhisperConfig>): WhisperTimestampExtractor {
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY || '';

  // 支持自定义 API 端点
  const baseUrl = config?.baseUrl || process.env.OPENAI_BASE_URL;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required. Set it in environment variables or pass it in config.');
  }

  return new WhisperTimestampExtractor({
    apiKey,
    model: config?.model,
    baseUrl,
    maxRetries: config?.maxRetries,
    retryDelay: config?.retryDelay,
  });
}

/**
 * Export for direct import
 */
export default WhisperTimestampExtractor;
