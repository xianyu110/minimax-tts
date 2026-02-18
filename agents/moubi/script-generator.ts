import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import type {
  GeneratedScript,
  ScriptGenerationRequest,
} from '../../lib/types/script.js';

/**
 * 墨笔 Agent - 脚本生成器
 *
 * 负责调用 Claude API 生成 60 秒视频脚本
 */
export class ScriptGenerator {
  private client: Anthropic;
  private promptTemplate: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    // 支持自定义 API 端点
    const baseURL = process.env.ANTHROPIC_BASE_URL;
    this.client = new Anthropic({
      apiKey,
      baseURL,
    });

    // 加载提示词模板
    const templatePath = path.join(
      process.cwd(),
      'lib',
      'prompts',
      'script-generator.txt'
    );
    this.promptTemplate = fs.readFileSync(templatePath, 'utf-8');
  }

  /**
   * 生成视���脚本
   *
   * @param request - 脚本生成请求参数
   * @returns 生成的脚本结构
   */
  async generateScript(request: ScriptGenerationRequest): Promise<GeneratedScript> {
    const { topic } = request;

    // 替换提示词模板中的变量
    const prompt = this.promptTemplate.replace('{{topic}}', topic);

    try {
      const response = await this.client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // 提取响应内容
      const content = response.content[0];
      let responseText = '';

      if (content.type === 'text') {
        responseText = content.text;
      } else {
        throw new Error('Unexpected response type from Claude API');
      }

      // 解析 JSON 响应
      const parsed = this.parseResponse(responseText);

      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate script: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 解析 Claude API 响应
   *
   * @param responseText - 原始响应文本
   * @returns 解析后的脚本结构
   */
  private parseResponse(responseText: string): GeneratedScript {
    // 尝试提取 JSON（处理可能的 markdown 代码块）
    let jsonText = responseText.trim();

    // 移除可能的 markdown 代码块标记
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }

    try {
      const parsed = JSON.parse(jsonText);

      // 验证基本结构
      if (!parsed.script || !Array.isArray(parsed.keywords) || !Array.isArray(parsed.segments)) {
        throw new Error('Invalid response structure: missing required fields');
      }

      // 验证关键词格式
      for (const keyword of parsed.keywords) {
        if (!keyword.word || !['cyan', 'gold', 'red'].includes(keyword.color)) {
          throw new Error('Invalid keyword structure');
        }
      }

      // 验证段落格式
      const validSegmentTypes = ['opening', 'pain', 'solution', 'closing'];
      for (const segment of parsed.segments) {
        if (!segment.text || !validSegmentTypes.includes(segment.type)) {
          throw new Error('Invalid segment structure');
        }
      }

      return parsed as GeneratedScript;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 格式化脚本为可读文本
   *
   * @param script - 脚本结构
   * @returns 格式化的文本
   */
  formatScript(script: GeneratedScript): string {
    let output = '';
    output += '=== 完整脚本 ===\n';
    output += script.script;
    output += '\n\n=== 关键词 ===\n';
    for (const keyword of script.keywords) {
      output += `[${keyword.color.toUpperCase()}] ${keyword.word}\n`;
    }
    output += '\n=== 分段 ===\n';
    for (const segment of script.segments) {
      output += `[${segment.type}] ${segment.text}\n`;
    }
    return output;
  }
}

// 导出单例实例
export const scriptGenerator = new ScriptGenerator();
