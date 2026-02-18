# Whisper API Timestamp Extractor

Service for transcribing audio files and extracting word/sentence-level timestamps using OpenAI's Whisper API.

## Features

- Audio file transcription with Whisper API
- Word-level timestamp extraction
- Automatic merging of words into sentence segments
- JSON output of timestamp segments
- Support for sentence endings in English and Chinese

## Usage

```typescript
import { createWhisperExtractor } from './services/whisper/index.js';

// Create extractor
const extractor = createWhisperExtractor({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'whisper-1',
});

// Transcribe audio
const segments = await extractor.transcribeAudio('./audio.mp3');

// Process and save to JSON
const segments = await extractor.processAudioFile('./audio.mp3', './output/timestamps.json');
```

## API

### `transcribeAudio(audioFilePath: string): Promise<TimestampSegment[]>`

Transcribes an audio file and returns timestamp segments.

### `processAudioFile(audioFilePath: string, outputJsonPath?: string): Promise<TimestampSegment[]>`

Processes an audio file and optionally saves the results to a JSON file.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Dependencies

- `axios`: HTTP client for API calls
- `form-data`: Multipart form data support
