/**
 * Time segment with start/end timestamps and text
 */
export interface TimestampSegment {
  start: number;  // seconds
  end: number;    // seconds
  text: string;
}

/**
 * Scene data for video production
 */
export interface SceneData {
  start: number;
  end: number;
  type: 'title' | 'pain' | 'emphasis' | 'circle';
  title?: string;
  subtitle?: string;
  number?: string;
  highlight?: string;
  xiaomo?: 'peek' | 'sit' | 'point' | 'circle' | 'think' | 'celebrate';
}

/**
 * Whisper API word-level timestamp response
 */
export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

/**
 * Whisper API response structure
 */
export interface WhisperResponse {
  text: string;
  words?: WhisperWord[];
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
    words?: WhisperWord[];
  }>;
}
