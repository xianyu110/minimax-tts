/**
 * 关键词颜色类型
 */
export type KeywordColor = 'cyan' | 'gold' | 'red';

/**
 * 关键词定义
 */
export interface Keyword {
  /** 关键词文本 */
  word: string;
  /** 显示颜色 */
  color: KeywordColor;
}

/**
 * 脚本段落类型
 */
export type SegmentType = 'opening' | 'pain' | 'solution' | 'closing';

/**
 * 脚本段落
 */
export interface ScriptSegment {
  /** 段落文本 */
  text: string;
  /** 段落类型 */
  type: SegmentType;
}

/**
 * 生成的脚本结构
 */
export interface GeneratedScript {
  /** 完整脚本文本 */
  script: string;
  /** 提取的关键词列表 */
  keywords: Keyword[];
  /** 分段数据 */
  segments: ScriptSegment[];
}

/**
 * 脚本生成请求参数
 */
export interface ScriptGenerationRequest {
  /** 视频主题 */
  topic: string;
}

/**
 * 脚本生成���应
 */
export interface ScriptGenerationResponse extends GeneratedScript {}
