// 根据MCP SDK 1.8.0的导出配置正确导入
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

// 导出组件
export { Server, ListToolsRequestSchema, CallToolRequestSchema }; 