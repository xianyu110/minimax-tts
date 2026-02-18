import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Topic, TopicList } from '../../lib/types/agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TopicResponse {
  title: string;
  description: string;
  category: string;
}

export class TopicGenerator {
  private client: Anthropic;
  private promptTemplate: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });

    // Load prompt template
    const promptPath = path.join(__dirname, '../../lib/prompts/topic-generator.txt');
    this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  }

  private buildPrompt(count: number): string {
    return this.promptTemplate.replace(/\{\{count\}\}/g, count.toString());
  }

  private generateId(): string {
    return `topic-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private parseResponse(content: string): TopicResponse[] {
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      let jsonStr = content.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        const lines = jsonStr.split('\n');
        const startIdx = lines.findIndex(line => line.includes('json') || line === '```');
        const endIdx = lines.lastIndexOf('```');

        if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
          jsonStr = lines.slice(startIdx + 1, endIdx).join('\n');
        }
      }

      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse Claude response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateTopics(count: number = 5): Promise<TopicList> {
    const prompt = this.buildPrompt(count);

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract content from response
      const contentBlock = response.content[0];
      const textContent = contentBlock.type === 'text' ? contentBlock.text : '';

      // Parse response into topics
      const topicResponses = this.parseResponse(textContent);

      // Convert to Topic format with IDs
      const topics: Topic[] = topicResponses.map((item) => ({
        id: this.generateId(),
        title: item.title,
        description: item.description,
        category: item.category,
      }));

      return {
        topics,
        generatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to generate topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  formatAsJSON(topicList: TopicList, pretty: boolean = true): string {
    return JSON.stringify(topicList, null, pretty ? 2 : 0);
  }
}

// Export a convenient function for direct usage
export async function generateTopics(count: number = 5): Promise<TopicList> {
  const generator = new TopicGenerator();
  return generator.generateTopics(count);
}
