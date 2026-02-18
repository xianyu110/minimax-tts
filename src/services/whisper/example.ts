/**
 * Example usage of WhisperTimestampExtractor
 */
import { createWhisperExtractor } from './timestamp-extractor.js';
import { createLogger } from '../../lib/utils/logger.js';

const logger = createLogger('WhisperExample');

async function main() {
  try {
    // Create extractor instance
    const extractor = createWhisperExtractor({
      // apiKey: 'your-api-key', // optional, will use OPENAI_API_KEY env var
      model: 'whisper-1',
    });

    // Example audio file path
    const audioFilePath = './output/test-audio.mp3';
    const outputJsonPath = './output/timestamps.json';

    logger.info('Starting audio transcription...');

    // Process audio and extract timestamps
    const segments = await extractor.processAudioFile(audioFilePath, outputJsonPath);

    logger.info(`Successfully extracted ${segments.length} segments`);

    // Print segments
    segments.forEach((segment, index) => {
      logger.info(`Segment ${index + 1}: [${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s] ${segment.text}`);
    });

  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
main();
