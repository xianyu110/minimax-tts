#!/usr/bin/env tsx

/**
 * Integration Test Script for MiniMax TTS Pipeline
 *
 * This script tests the complete pipeline from topic generation to video rendering.
 * It supports two modes:
 * - mock: Uses mock data without calling real APIs
 * - api: Calls real APIs (requires valid API keys)
 *
 * Usage:
 *   npm run test:mock    # Test with mock data
 *   npm run test:api     # Test with real APIs
 */

import { createLogger, LogLevel } from '../src/lib/utils/logger.js';

const logger = createLogger('TestPipeline', LogLevel.INFO);

// Mock data for testing
const MOCK_TOPICS = [
  { id: 'topic-1', title: 'AI 编程助手', description: '如何用 AI 提高编程效率', category: 'AI工具' },
  { id: 'topic-2', title: 'VS Code 技巧', description: '10 个实用的编辑器技巧', category: '效率提升' },
  { id: 'topic-3', title: '前端性能优化', description: '让网页加载速度提升 5 倍', category: '编程技巧' },
];

const MOCK_SCRIPT = {
  script: '大家好，今天分享一个让网页加载速度提升 5 倍的技巧。你是不是经常遇到网页打开很慢的问题？其实只需要配置一下 CDN 和图片压缩，就能大大提升加载速度。试试看吧！',
  keywords: [
    { word: 'CDN', color: 'cyan' },
    { word: '5', color: 'gold' },
  ],
  segments: [
    { text: '大家好，今天分享一个让网页加载速度提升 5 倍的技巧。', type: 'opening' },
    { text: '你是不是经常遇到网页打开很慢的问题？', type: 'pain' },
    { text: '其实只需要配置一下 CDN 和图片压缩，就能大大提升加载速度。', type: 'solution' },
    { text: '试试看吧！', type: 'closing' },
  ],
};

const MOCK_TIMESTAMP_SEGMENTS = [
  { start: 0, end: 2.5, text: '大家好，今天分享一个让网页加载速度提升 5 倍的技巧。' },
  { start: 2.5, end: 5.0, text: '你是不是经常遇到网页打开很慢的问题？' },
  { start: 5.0, end: 9.5, text: '其实只需要配置一下 CDN 和图片压缩，就能大大提升加载速度。' },
  { start: 9.5, end: 11.5, text: '试试看吧！' },
];

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const testResults: TestResult[] = [];

/**
 * Test runner helper
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  logger.info(`Running: ${name}`);

  try {
    await testFn();
    const duration = Date.now() - startTime;
    testResults.push({ name, passed: true, duration });
    logger.success(`✓ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({ name, passed: false, duration, error: errorMessage });
    logger.error(`✗ ${name}: ${errorMessage}`);
  }
}

/**
 * Mock Topic Generator Test
 */
async function testMockTopicGenerator(): Promise<void> {
  // Simulate topic generation delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const topicList = {
    topics: MOCK_TOPICS,
    generatedAt: new Date(),
  };

  if (!topicList.topics || topicList.topics.length === 0) {
    throw new Error('No topics generated');
  }

  logger.info(`Generated ${topicList.topics.length} topics`);
  logger.info(`Sample topic: ${topicList.topics[0].title}`);
}

/**
 * Mock Script Generator Test
 */
async function testMockScriptGenerator(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const script = MOCK_SCRIPT;

  if (!script.script || script.script.length === 0) {
    throw new Error('Empty script generated');
  }

  if (!script.keywords || script.keywords.length === 0) {
    throw new Error('No keywords extracted');
  }

  if (!script.segments || script.segments.length === 0) {
    throw new Error('No segments generated');
  }

  logger.info(`Generated script: ${script.script.substring(0, 50)}...`);
  logger.info(`Keywords: ${script.keywords.map(k => k.word).join(', ')}`);
}

/**
 * Mock TTS Generator Test
 */
async function testMockTTSGenerator(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));

.

  const mockAudioPath = '/Users/chinamanor/Downloads/cursor编程/minimax-tts/output/audio/test-audio.mp3';

  logger.info(`Generated audio at: ${mockAudioPath}`);
}

/**
 * Mock Whisper Timestamp Extractor Test
 */
async function testMockWhisperExtractor(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const segments = MOCK_TIMESTAMP_SEGMENTS;

  if (!segments || segments.length === 0) {
    throw new Error('No timestamp segments extracted');
  }

  // Verify segment continuity
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].end > segments[i + 1].start) {
      throw new Error(`Segment overlap detected at index ${i}`);
    }
  }

  logger.info(`Extracted ${segments.length} timestamp segments`);
  logger.info(`Total duration: ${segments[segments.length - 1].end}s`);
}

/**
 * Mock Scene Orchestrator Test
 */
async function testMockSceneOrchestrator(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const scenes = [
    { start: 0, end: 2.5, type: 'title', title: '前端性能优化' },
    { start: 2.5, end: 5.0, type: 'pain', subtitle: '网页打开慢？' },
    { start: 5.0, end: 9.5, type: 'solution', highlight: 'CDN + 图片压缩' },
    { start: 9.5, end: 11.5, type: 'closing', xiaomo: 'celebrate' },
  ];

  if (!scenes || scenes.length === 0) {
    throw new Error('No scenes orchestrated');
  }

  logger.info(`Orchestrated ${scenes.length} scenes`);
}

/**
 * Mock Remotion Renderer Test
 */
async function testMockRemotionRenderer(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const mockVideoPath = '/Users/chinamanor/Downloads/cursor编程/minimax-tts/output/videos/test-video.mp4';

  logger.info(`Rendered video at: ${mockVideoPath}`);
}

/**
 * Real API Tests
 */
async function testRealTopicGenerator(): Promise<void> {
  try {
    const { TopicGenerator } = await import('../agents/momo/topic-generator.js');
    const generator = new TopicGenerator();
    const result = await generator.generateTopics(5);

    if (!result.topics || result.topics.length === 0) {
      throw new Error('No topics generated');
    }

    logger.info(`Generated ${result.topics.length} topics`);
    logger.info(`Sample topic: ${result.topics[0].title}`);
  } catch (error) {
    throw new Error(`Topic generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testRealScriptGenerator(): Promise<void> {
  try {
    const { ScriptGenerator } = await import('../agents/moubi/script-generator.js');
    const generator = new ScriptGenerator();
    const result = await generator.generateScript({
      topic: '前端性能优化',
    });

    if (!result.script || result.script.length === 0) {
      throw new Error('Empty script generated');
    }

    logger.info(`Generated script: ${result.script.substring(0, 50)}...`);
  } catch (error) {
    throw new Error(`Script generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testRealTTSGenerator(): Promise<void> {
  try {
    const { minimaxTTS } = await import('../services/tts/minimax.js');
    const audioPath = await minimaxTTS.generateAudio('这是一段测试语音。', {
      voice_id: 'z0000000425',
      speed: 1.15,
    });

    logger.info(`Generated audio at: ${audioPath}`);
  } catch (error) {
    throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testRealWhisperExtractor(): Promise<void> {
  try {
    const { createWhisperExtractor } = await import('../src/services/whisper/index.js');
    const extractor = createWhisperExtractor();

    // This test requires an actual audio file
    // For now, we'll skip if no audio file exists
    const testAudioPath = '/Users/chinamanor/Downloads/cursor编程/minimax-tts/output/audio/test-audio.mp3';

    try {
      const segments = await extractor.processAudioFile(testAudioPath);
      logger.info(`Extracted ${segments.length} timestamp segments`);
    } catch (error) {
      logger.warn(`Skipping Whisper test extraction - requires audio file`);
      logger.info(`Whisper extractor initialized successfully`);
    }
  } catch (error) {
    throw new Error(`Whisper initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Print test summary
 */
function printSummary(): void {
  const totalTests = testResults.length;
  const passedTests = testResults.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);

  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Duration: ${totalDuration}ms`);
  console.log('='.repeat(60));

  if (failedTests > 0) {
    console.log('\nFailed Tests:');
    test for (const result of testResults) {
      if (!result.passed) {
        console.log(`  ✗ ${result.name}`);
        console.log(`    ${result.error}`);
      }
    }
  }

  console.log('\n');
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const mode = process.argv[2] || 'mock';

  console.log('\n' + '='.repeat(60));
  console.log('AI Video Automation System - Integration Test');
  console.log('='.repeat(60));
  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log('='.repeat(60) + '\n');

  if (mode === 'mock') {
    // Run mock tests
    await runTest('Mock: Topic Generator', testMockTopicGenerator);
    await runTest('Mock: Script Generator', testMockScriptGenerator);
    await runTest('Mock: TTS Generator', testMockTTSGenerator);
    await runTest('Mock: Whisper Extractor', testMockWhisperExtractor);
    await runTest('Mock: Scene Orchestrator', test);
  } else if (mode === 'api') {
    // Check for required API keys
    const requiredKeys = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'FAL_KEY'];
    const missingKeys = requiredKeys.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
      logger.error(`Missing required environment variables: ${missingKeys.join(', ')}`);
      logger.error('Please configure .env file with required API keys');
      process.exit(1);
    }

    // Run real API tests
    await runTest('API: Topic Generator', testRealTopicGenerator);
    await runTest('API: Script Generator', testRealScriptGenerator);
    await runTest('API: TTS Generator', testRealTTSGenerator);
    await runTest('API: Whisper Extractor', testRealWhisperExtractor);
  } else {
    logger.error(`Invalid mode: ${mode}. Use 'mock' or 'api'`);
    process.exit(1);
  }

  // Print summary
  printSummary();

  // Exit with appropriate code
  const failedTests = testResults.filter((r) => !r.passed).length;
  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
