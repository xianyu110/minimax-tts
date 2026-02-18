import * as fs from 'fs';
import * as path from 'path';
import type {
  GeneratedScript,
  ScriptSegment,
} from '../../lib/types/script.js';
import type {
  SceneData,
  TimestampSegment,
} from '../../src/lib/types/scene.js';
import { createLogger } from '../../src/lib/utils/logger.js';

const logger = createLogger('SceneOrchestrator');

/**
 * Scene type mapping configuration
 */
interface SceneTypeMapping {
  type: 'title' | 'pain' | 'emphasis' | 'circle';
  xiaomo: 'peek' | 'sit' | 'point' | 'circle' | 'think' | 'celebrate';
}

/**
 * Scene orchestrator service
 *
 * Orchestrates scene data generation from script and timestamps
 */
export class SceneOrchestrator {
  private readonly sceneTypeMap: Record<string, SceneTypeMapping> = {
    opening: { type: 'title', xiaomo: 'peek' },
    pain: { type: 'pain', xiaomo: 'sit' },
    solution: { type: 'emphasis', xiaomo: 'point' },
    closing: { type: 'circle', xiaomo: 'celebrate' },
  };

  /**
   * Orchestrates scene data from script and timestamps
   *
   * @param script - Generated script with segments
   * @param timestamps - Whisper timestamp segments
   * @returns Array of scene data
   */
  async orchestrateScenes(
    script: GeneratedScript,
    timestamps: TimestampSegment[]
  ): Promise<SceneData[]> {
    logger.info('Starting scene orchestration', {
      segmentCount: script.segments.length,
      timestampCount: timestamps.length,
    });

    const scenes: SceneData[] = [];

    // Calculate total duration from timestamps
    const totalDuration = timestamps.length > 0
      ? timestamps[timestamps.length - 1].end
      : 60; // Default 60 seconds

    // Calculate average duration per scene
    const avgDuration = script.segments.length > 0
      ? totalDuration / script.segments.length
      : 0;

    let currentStart = 0;

    for (let i = 0; i < script.segments.length; i++) {
      const segment = script.segments[i];
      const mapping = this.sceneTypeMap[segment.type];

      if (!mapping) {
        logger.warn(`Unknown segment type: ${segment.type}, skipping`);
        continue;
      }

      // Calculate scene end time
      let currentEnd: number;
      if (i < script.segments.length - 1) {
        currentEnd = currentStart + avgDuration;
      } else {
        // Last scene goes to the end
        currentEnd = totalDuration;
      }

      // Find matching timestamp segment for current script segment
      const matchingTimestamp = this.findMatchingTimestamp(
        segment.text,
        timestamps,
        currentStart,
        currentEnd
      );

      // Update scene times based on actual timestamp if found
      if (matchingTimestamp) {
        currentStart = matchingTimestamp.start;
        currentEnd = matchingTimestamp.end;
      }

      // Create scene data
      const scene: SceneData = {
        start: currentStart,
        end: currentEnd,
        type: mapping.type,
        xiaomo: mapping.xiaomo,
      };

      // Add segment-specific fields based on type
      this.enrichSceneData(scene, segment, i);

      scenes.push(scene);

      // Update start time for next scene
      currentStart = currentEnd;
    }

    logger.info('Scene orchestration completed', {
      sceneCount: scenes.length,
      totalDuration: scenes[scenes.length - 1]?.end ?? 0,
    });

    return scenes;
  }

  /**
   * Find the timestamp segment that best matches a script segment
   *
   * @param scriptText - Script segment text
   * @param timestamps - Available timestamp segments
   * @param approximateStart - Approximate start time
   * @param approximateEnd - Approximate end time
   * @returns Matching timestamp segment or undefined
   */
  private findMatchingTimestamp(
    scriptText: string,
    timestamps: TimestampSegment[],
    approximateStart: number,
    approximateEnd: number
  ): TimestampSegment | undefined {
    if (timestamps.length === 0) {
      return undefined;
    }

    // Normalize script text for comparison
    const normalizedScript = this.normalizeText(scriptText);

    // Find timestamp with highest text similarity
    let bestMatch: TimestampSegment | undefined;
    let bestScore = 0;

    for (const timestamp of timestamps) {
      const normalizedTimestamp = this.normalizeText(timestamp.text);

      // Check if timestamp is within approximate time range
      const timeInRange = (
        timestamp.start >= approximateStart &&
        timestamp.end <= approximateEnd + 2 // Allow 2 seconds buffer
      );

      // Calculate text similarity score
      const similarity = this.calculateSimilarity(normalizedScript, normalizedTimestamp);

      // Weight time range and similarity
      const score = timeInRange ? similarity * 1.5 : similarity * 0.5;

      if (score > bestScore && similarity > 0.3) {
        bestScore = score;
        bestMatch = timestamp;
      }
    }

    return bestMatch;
  }

  /**
   * Normalize text for comparison
   *
   * @param text - Input text
   * @returns Normalized text
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '') // Keep only letters, numbers, and spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate text similarity using Jaccard index
   *
   * @param text1 - First text
   * @param text2 - Second text
   * @returns Similarity score (0-1)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));

    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }

    const intersection = new Set<string>();
    for (const word of words1) {
      if (words2.has(word)) {
        intersection.add(word);
      }
    }

    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Enrich scene data with segment-specific fields
   *
   * @param scene - Scene data to enrich
   * @param segment - Script segment
   * @param index - Segment index
   */
  private enrichSceneData(
    scene: SceneData,
    segment: ScriptSegment,
    index: number
  ): void {
    const text = segment.text;

    switch (segment.type) {
      case 'opening':
        // Opening: title with subtitle
        const parts = this.splitTextIntoParts(text);
        scene.title = parts[0] || '';
        scene.subtitle = parts[1] || '';
        break;

      case 'pain':
        // Pain: highlight text
        scene.highlight = text.length > 50
          ? text.substring(0, 50) + '...'
          : text;
        break;

      case 'solution':
        // Solution: number and title
        scene.number = String(index);
        scene.title = text.length > 30
          ? text.substring(0, 30) + '...'
          : text;
        break;

      case 'closing':
        // Closing: title for the quote/meme
        scene.title = text.length > 40
          ? text.substring(0, 40) + '...'
          : text;
        break;
    }
  }

  /**
   * Split text into two parts (e.g., title and subtitle)
   *
   * @param text - Input text
   * @returns Array of up to two parts
   */
  private splitTextIntoParts(text: string): string[] {
    // Try to split by common punctuation
    const splitPatterns = [/[。！？.!?]\s*/, /,\s*/, /\n/];

    for (const pattern of splitPatterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        const firstPart = text.substring(0, match.index + match[0].length).trim();
        const secondPart = text.substring(match.index + match[0].length).trim();
        if (firstPart && secondPart) {
          return [firstPart, secondPart];
        }
      }
    }

    // Fallback: split in the middle
    const mid = Math.floor(text.length / 2);
    return [
      text.substring(0, mid).trim(),
      text.substring(mid).trim(),
    ];
  }

  /**
   * Save scenes data to file
   *
   * @param scenes - Scene data array
   * @param outputPath - Output file path
   */
  async saveScenesToFile(scenes: SceneData[], outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write TypeScript file
    const content = `/**
 * Auto-generated scenes data
 * Generated at: ${new Date().toISOString()}
 */

export const scenesData = ${JSON.stringify(scenes, null, 2)} as const;

export type SceneData = typeof scenesData[number];
`;

    fs.writeFileSync(outputPath, content, 'utf-8');

    logger.info('Scenes data saved to file', { path: outputPath });
  }

  /**
   * Generate and save scenes data in one operation
   *
   * @param script - Generated script with segments
   * @param timestamps - Whisper timestamp segments
   * @param outputPath - Output file path (optional, defaults to remotion/src/scenes-data.ts)
   * @returns Array of scene data
   */
  async generateAndSave(
    script: GeneratedScript,
    timestamps: TimestampSegment[],
    outputPath?: string
  ): Promise<SceneData[]> {
    const scenes = await this.orchestrateScenes(script, timestamps);

    const defaultPath = path.join(
      process.cwd(),
      'remotion',
      'src',
      'scenes-data.ts'
    );

    await this.saveScenesToFile(scenes, outputPath ?? defaultPath);

    return scenes;
  }
}

/**
 * Export singleton instance
 */
export const sceneOrchestrator = new SceneOrchestrator();
