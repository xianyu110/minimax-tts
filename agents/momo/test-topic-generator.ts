import dotenv from 'dotenv';
import { generateTopics } from './topic-generator.js';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🔥 正在调用 Claude API 生成选题...\n');

  try {
    const result = await generateTopics(5);

    console.log('✅ 选题生成成功！\n');
    console.log(`生成时间: ${result.generatedAt.toISOString()}`);
    console.log(`选题数量: ${result.topics.length}\n`);

    result.topics.forEach((topic, index) => {
      console.log(`${index + 1}. [${topic.category}] ${topic.title}`);
      console.log(`   ID: ${topic.id}`);
      console.log(`   描述: ${topic.description}\n`);
    });

    console.log('--- JSON 输出 ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 生成失败:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
