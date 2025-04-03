declare module '@modelcontextprotocol/sdk' {
  export class Server {
    constructor(
      serverInfo: { name: string; version: string },
      capabilities: { capabilities: { tools: object } }
    );
    setRequestHandler(schema: any, handler: (request: any) => Promise<any>): void;
    listen(): void;
  }

  export const ListToolsRequestSchema: unique symbol;
  export const CallToolRequestSchema: unique symbol;
  
  export interface CallToolRequest {
    params: {
      name: string;
      arguments?: any;
    };
  }
} 