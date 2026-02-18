/**
 * Test script for VideoRenderer
 *
 * Usage: npx tsx agents/moubi/test-renderer.ts
 */

import { videoRenderer } from './renderer.js';

async function testRenderer() {
  console.log('Testing VideoRenderer...\n');

  // Test 1: Check if Remotion is available
  console.log('1. Checking if Remotion is available...');
  const isAvailable = await videoRenderer.isRemotionAvailable();
  console.log(`   Remotion available: ${isAvailable ? 'Yes' : 'No'}\n`);

  if (!isAvailable) {
    console.error('Remotion CLI is not available. Please install dependencies in remotion/');
    process.exit(1);
  }

  // Test 2: Validate inputs (these files may not exist yet)
  console.log('2. Testing input validation...');
  try {
    await videoRenderer.renderVideo(
      'remotion/src/scenes-data.ts',
      'output/audio/test.mp3',
      'output/videos/test.mp4',
      {
        progressCallback: (progress) => {
          if (progress.percent) {
            console.log(`   Progress: ${progress.percent.toFixed(1)}%`);
          }
          if (progress.step) {
            console.log(`   Step: ${progress.step}`);
          }
        },
      }
    );
    console.log('   Render successful!\n');
  } catch (error) {
    console.log(`   Expected error (files not ready): ${(error as Error).message}\n`);
  }

  console.log('VideoRenderer test completed.');
}

testRenderer().catch(console.error);
