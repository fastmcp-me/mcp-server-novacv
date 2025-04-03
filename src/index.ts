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
      console.log("mcp-server-novacv v1.0.2");
      process.exit(0);
    }
  });
  return args;
}

// 显示帮助信息
function showHelp() {
  console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              NovaCV MCP 服务 v1.0.2               ┃
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
  "generate_resume_from_text",
  "一键将简历文本转换为精美PDF简历，支持多种模板。只需提供简历文本内容，系统会自动进行格式转换并生成专业PDF文件，无需手动处理JSON数据。可选择不同简历模板和定制选项。",
  {
    resumeText: z.string(),
    templateName: z.string().optional(),
    options: z.object({}).optional()
  },
  async ({ resumeText, templateName = "elite", options = {} }, extra) => {
    if (!resumeText) {
      throw new Error("简历文本是必需的");
    }
    
    try {
      // 第一步：将文本转换为JSON Resume格式
      const convertResult = await novaCVService.convertTextToJsonResume(resumeText);
      
      // 调试输出API响应结构
      console.log("转换API响应:", JSON.stringify(convertResult, null, 2));
      
      if (!convertResult || convertResult.error) {
        return {
          content: [
            {
              type: "text",
              text: `转换简历文本失败: ${convertResult?.error?.message || convertResult?.message || "未知错误"}`
            }
          ],
        };
      }
      
      // 根据实际API响应结构获取简历数据
      // 尝试多种可能的路径
      let resumeData = null;
      if (convertResult.data && convertResult.data.resumeData) {
        resumeData = convertResult.data.resumeData;
      } else if (convertResult.data && convertResult.data.jsonResume) {
        // 处理API返回的jsonResume路径
        resumeData = convertResult.data.jsonResume;
      } else if (convertResult.resumeData) {
        resumeData = convertResult.resumeData;
      } else if (convertResult.jsonResume) {
        resumeData = convertResult.jsonResume;
      } else if (typeof convertResult === 'object' && Object.keys(convertResult).length > 0) {
        // 如果响应本身就是简历数据对象
        if (convertResult.basics || convertResult.work || convertResult.education) {
          resumeData = convertResult;
        }
      }
      
      // 检查是否获取到简历数据
      if (!resumeData) {
        // 输出完整响应以帮助调试
        return {
          content: [
            {
              type: "text",
              text: `转换成功但无法获取简历数据。API响应:\n${JSON.stringify(convertResult, null, 2)}`
            }
          ],
        };
      }
      
      // 第二步：使用JSON Resume数据生成PDF
      console.log("使用以下数据生成PDF:", JSON.stringify(resumeData, null, 2));
      const generateResult = await novaCVService.generateResume(resumeData, templateName, options);
      
      return {
        content: [
          {
            type: "text",
            text: safeStringify(generateResult)
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
  "获取所有可用的简历模板，返回模板列表及其详细信息，包括模板ID、名称、缩略图等。帮助用户选择最适合的简历风格。",
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
  "将纯文本格式的简历内容转换为标准JSON Resume格式。系统会智能识别简历中的各个部分（如个人信息、工作经历、教育背景等），并按照国际通用的JSON Resume标准进行结构化处理，方便后续编辑和格式转换。",
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
  "对简历文本进行深度分析，提供专业评估和改进建议。系统会分析简历的完整性、关键词使用、技能匹配度等方面，并给出针对性的优化建议，帮助求职者打造更具竞争力的简历。",
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
┃              NovaCV MCP 服务 v1.0.2               ┃
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