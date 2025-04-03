#!/usr/bin/env node

// 使用最新的MCP SDK导入方式
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod'; // 导入zod库
import { config } from 'dotenv';
import { NovaCVService } from './services/novacv.js';

// 加载环境变量
config();

// 解析命令行参数
function parseArgs() {
  const args: Record<string, string> = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      args[key] = value;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (arg === "--version" || arg === "-v") {
      console.log("mcp-server-novacv v1.0.0");
      process.exit(0);
    }
  });
  return args;
}

// 显示帮助信息
function showHelp() {
  console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              NovaCV MCP 服务 v1.0.0               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

使用方法: 
  npx mcp-server-novacv [选项]

选项:
  --api_key=KEY        设置 NovaCV API 密钥
  --api_base_url=URL   设置 API 基础 URL
  --timeout=MS         设置 API 超时时间 (毫秒)
  --help, -h           显示帮助信息
  --version, -v        显示版本信息

环境变量:
  NOVACV_API_KEY       NovaCV API 密钥
  NOVACV_API_BASE_URL  API 基础 URL
  NOVACV_TIMEOUT       API 超时时间 (毫秒)

使用示例:
  1. 直接运行 (环境变量中已设置密钥):
     npx mcp-server-novacv
  
  2. 指定 API 密钥:
     npx mcp-server-novacv --api_key=your_api_key
  
  3. 在 Cursor 或其他 MCP 客户端中使用:
     在 .cursorrc 或客户端配置中设置
  
更多信息请访问: https://github.com/yourusername/mcp-server-novacv
`);
}

// 获取API配置
const args = parseArgs();
const apiKey = args.api_key || process.env.NOVACV_API_KEY;
const apiBaseUrl = args.api_base_url || process.env.NOVACV_API_BASE_URL;
// 获取超时设置 (毫秒)
const timeout = parseInt(args.timeout || process.env.NOVACV_TIMEOUT || '30000', 10);

if (!apiKey) {
  console.error('错误: 缺少NovaCV API密钥。请通过--api_key参数或NOVACV_API_KEY环境变量设置。');
  console.log('运行 "npx mcp-server-novacv --help" 获取更多信息。');
  process.exit(1);
}

// 初始化NovaCV服务
const novaCVService = new NovaCVService(apiKey, apiBaseUrl, timeout);

// 创建MCP服务器
const server = new McpServer({
  name: "mcp-server-novacv",
  version: "1.0.0",
});

// 辅助函数：安全地将API响应转换为字符串
const safeStringify = (data: any): string => {
  try {
    // 特别处理API错误响应
    if (data && data.error) {
      return `API错误: ${data.error.message || JSON.stringify(data.error)}`;
    }
    
    // 处理标准成功响应
    if (data && data.success === true && data.data) {
      const responseData = data.data;
      if (responseData.fileUrl) {
        return `简历生成成功，下载地址: ${responseData.fileUrl}`;
      }
    }
    
    // 默认JSON字符串化
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return "API返回了结果，但无法转换为字符串展示（可能包含循环引用）";
  }
};

// 定义工具
server.tool(
  "generate_resume",
  "Generate a PDF resume from JSON Resume data",
  {
    resumeData: z.any(),  // 改为z.any()以接受任何类型的输入
    templateName: z.string().optional(),
    options: z.object({}).optional()
  },
  async ({ resumeData, templateName = "elite", options = {} }, extra) => {
    if (!resumeData) {
      throw new Error("简历数据是必需的");
    }
    
    try {
      // 处理resumeData作为正确的简历数据对象
      let processedResumeData: any;
      
      // 强化JSON字符串检测和处理
      if (typeof resumeData === 'string') {
        try {
          // 尝试解析JSON字符串
          processedResumeData = JSON.parse(resumeData);
        } catch (e: any) {
          // 查看字符串内容，尝试清理和再次解析
          const trimmed = resumeData.trim();
          
          try {
            // 尝试去除可能有的引号包装
            if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
                (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
              const unwrapped = trimmed.substring(1, trimmed.length - 1).replace(/\\"/g, '"');
              processedResumeData = JSON.parse(unwrapped);
            } else {
              throw new Error("无法解析JSON字符串");
            }
          } catch (e2: any) {
            return {
              content: [
                {
                  type: "text",
                  text: `错误: resumeData不是有效的JSON格式: ${e2.message}\n\n请确保提供有效的JSON对象或不带转义的JSON字符串。`
                }
              ],
            };
          }
        }
      } else if (typeof resumeData === 'object') {
        // 如果已经是对象，直接使用
        processedResumeData = resumeData;
      } else {
        return {
          content: [
            {
              type: "text",
              text: `错误: resumeData类型不支持: ${typeof resumeData}`
            }
          ],
        };
      }
      
      // 不再进行数据校验和默认值设置，直接传递原始数据
      const result = await novaCVService.generateResume(processedResumeData, templateName, options);
      return {
        content: [
          {
            type: "text",
            text: safeStringify(result)
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error.message || "未知错误"}`
          }
        ],
      };
    }
  }
);

server.tool(
  "get_templates",
  "Get all available resume templates",
  {},
  async (_, extra) => {
    try {
      const templates = await novaCVService.getTemplates();
      return {
        content: [
          {
            type: "text",
            text: safeStringify(templates)
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error.message || "未知错误"}`
          }
        ],
      };
    }
  }
);

server.tool(
  "convert_resume_text",
  "Convert resume text to JSON Resume format",
  {
    resumeText: z.string()
  },
  async ({ resumeText }, extra) => {
    if (!resumeText) {
      throw new Error("简历文本是必需的");
    }
    
    try {
      const result = await novaCVService.convertTextToJsonResume(resumeText);
      return {
        content: [
          {
            type: "text",
            text: safeStringify(result)
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error.message || "未知错误"}`
          }
        ],
      };
    }
  }
);

server.tool(
  "analyze_resume_text",
  "Analyze resume text content",
  {
    resumeText: z.string()
  },
  async ({ resumeText }, extra) => {
    if (!resumeText) {
      throw new Error("简历文本是必需的");
    }
    
    try {
      const result = await novaCVService.analyzeResumeText(resumeText);
      return {
        content: [
          {
            type: "text",
            text: safeStringify(result)
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `错误: ${error.message || "未知错误"}`
          }
        ],
      };
    }
  }
);

server.tool(
  "validate_resume_data",
  "验证简历数据格式是否符合要求",
  {
    resumeData: z.any() // 接受任何类型的输入
  },
  async ({ resumeData }, extra) => {
    try {
      let validatedData: any;
      let issues: string[] = [];
      
      // 解析JSON (如果是字符串)
      if (typeof resumeData === 'string') {
        try {
          validatedData = JSON.parse(resumeData);
        } catch (e: any) {
          return {
            content: [
              {
                type: "text",
                text: `❌ 无效的JSON字符串格式: ${e.message}`
              }
            ],
          };
        }
      } else if (typeof resumeData === 'object') {
        validatedData = resumeData;
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ 不支持的数据类型: ${typeof resumeData}`
            }
          ],
        };
      }
      
      // 验证数据结构
      if (!validatedData) {
        issues.push("❌ 数据为空");
      } else {
        // 检查基本字段
        if (!validatedData.basics) {
          issues.push("❌ 缺少 'basics' 字段");
        } else {
          if (!validatedData.basics.name) issues.push("⚠️ 缺少 'basics.name' 字段");
          if (!validatedData.basics.email) issues.push("⚠️ 缺少 'basics.email' 字段");
        }
        
        // 检查关键数组字段
        ['work', 'education', 'skills'].forEach(field => {
          if (!Array.isArray(validatedData[field])) {
            issues.push(`⚠️ '${field}' 不是数组或不存在`);
          } else if (validatedData[field].length === 0) {
            issues.push(`⚠️ '${field}' 数组为空`);
          }
        });
      }
      
      // 返回验证结果
      const isPassing = issues.length === 0;
      
      return {
        content: [
          {
            type: "text",
            text: isPassing 
              ? "✅ 简历数据格式验证通过！\n\n" + JSON.stringify(validatedData, null, 2)
              : "简历数据验证结果:\n" + issues.join("\n") + "\n\n数据内容:\n" + JSON.stringify(validatedData, null, 2)
          }
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `验证时发生错误: ${error.message || "未知错误"}`
          }
        ],
      };
    }
  }
);

// 包装主函数以支持顶层await
const main = async () => {
  try {
    // 创建传输层并连接
    const transport = new StdioServerTransport();
    
    // 检查是否是直接从命令行运行
    const isDirectRun = !process.env.MCP_INSPECTOR && process.stdout.isTTY;
    
    // 如果是直接运行，显示欢迎消息
    if (isDirectRun) {
      console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              NovaCV MCP 服务 v1.0.0               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

服务已启动，正在等待 MCP 客户端连接...
API 基础 URL: ${apiBaseUrl || "默认API地址"}

您可以:
1. 在 Cursor 或其他 MCP 客户端中使用此服务
2. 使用 "npm run inspector" 在调试模式下运行
3. 按 Ctrl+C 停止服务

提示: 如果您是直接运行此服务，您可能需要使用 MCP Inspector 进行测试:
      npm run debug
`);
    }
    
    await server.connect(transport);
  } catch (err: any) {
    console.error(`MCP服务器启动错误: ${err.message || err}`);
    process.exit(1);
  }
};

// 执行主函数
main().catch(err => {
  process.stderr.write(`MCP服务器启动错误: ${err.message || err}\n`);
  process.exit(1);
});

// 捕获中断信号
process.on('SIGINT', () => {
  console.log('\n服务已停止。');
  process.exit(0);
});

// 注意: 以下控制台输出会干扰 MCP Inspector 的通信
// 仅在非 MCP Inspector 模式下才会输出
// MCP Inspector 会设置环境变量 MCP_INSPECTOR=true 