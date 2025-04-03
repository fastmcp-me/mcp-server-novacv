# MCP Server for NovaCV

模型上下文协议(MCP)服务器，用于接入 NovaCV 简历服务 API。

## 功能特点

- 生成简历 PDF
- 获取可用简历模板列表
- 将简历文本转换为 JSON Resume 格式
- 分析简历文本内容

## 获取 API 密钥

在使用此服务前，您需要获取 NovaCV API 密钥：

1. 访问 [NovaCV API 官网](https://api.nova-cv.com)
2. 注册或登录您的账户
3. 在控制面板中找到 "API Keys" 或 "开发者" 部分
4. 创建新的 API 密钥并复制它
5. 在使用 MCP 服务时配置此密钥

请妥善保管您的 API 密钥，不要在公共场合分享。

## 安装

```bash
# 全局安装
npm install -g mcp-server-novacv

# 或使用 npx 运行
npx mcp-server-novacv --api_key=your_api_key
```

## 快速开始

### 方法一：直接运行（推荐）

最简单的方式是使用我们提供的快速启动命令：

```bash
# 一键构建并启动服务
npm run run
```

### 方法二：使用 MCP Inspector 进行开发和测试

我们提供了一个组合命令，可以一键构建和启动 Inspector：

```bash
# 一键构建并启动 Inspector
npm run debug
```

## 使用方法

### 命令行选项

```bash
npx mcp-server-novacv [选项]

选项:
  --api_key=KEY        设置 NovaCV API 密钥
  --api_base_url=URL   设置 API 基础 URL
  --timeout=MS         设置 API 超时时间 (毫秒)
  --help, -h           显示帮助信息
  --version, -v        显示版本信息
```

### 环境变量配置

可以通过环境变量配置 API 密钥：

```bash
NOVACV_API_KEY=your_api_key mcp-server-novacv
```

或者创建 `.env` 文件：

```
NOVACV_API_KEY=your_api_key
NOVACV_API_BASE_URL=https://api.nova-cv.com
```

> **提示**：API 密钥可以从 [NovaCV API 官网](https://api.nova-cv.com) 获取，请参考上方的 "获取 API 密钥" 部分。

### 在 MCP 客户端配置

#### Cursor 配置

在 Cursor 配置文件中添加:

```json
{
  "mcpServers": {
    "novacv": {
      "command": "npx",
      "args": ["mcp-server-novacv"],
      "env": {
        "NOVACV_API_KEY": "your_api_key"
      }
    }
  }
}
```

#### Cherry Studio 配置

在 Cherry Studio 中设置 MCP 服务:

1. 打开设置（点击左下角设置图标或使用 `Ctrl+,`/`Cmd+,`）
2. 找到 MCP 或 Model Context Protocol 设置区域
3. 添加新服务，配置如下:
   - 名称: `novacv`
   - 命令: `npx`
   - 参数: `mcp-server-novacv`
   - 环境变量: 添加 `NOVACV_API_KEY` 并设置您的 API 密钥

如果支持 JSON 配置，添加以下内容:

```json
{
  "novacv": {
    "command": "npx",
    "args": ["mcp-server-novacv"],
    "env": {
      "NOVACV_API_KEY": "your_api_key"
    }
  }
}
```

## 可用工具

MCP 服务器提供以下工具：

- `generate_resume_from_text`: 一键将简历文本转换为精美PDF简历，支持多种模板。只需提供简历文本内容，系统会自动进行格式转换并生成专业PDF文件，无需手动处理JSON数据
- `get_templates`: 获取所有可用的简历模板，返回模板列表及其详细信息，包括模板ID、名称、缩略图等
- `convert_resume_text`: 将纯文本格式的简历内容转换为标准JSON Resume格式。系统会智能识别简历中的各个部分，并按照国际通用的JSON Resume标准进行结构化处理
- `analyze_resume_text`: 对简历文本进行深度分析，提供专业评估和改进建议。系统会分析简历的完整性、关键词使用、技能匹配度等方面，并给出针对性的优化建议

## 使用示例

### 获取模板列表

在支持 MCP 的客户端中使用 `mcp_novacv_get_templates` 命令获取所有可用的简历模板。

### 生成简历

使用 `mcp_novacv_generate_resume_from_text` 命令并提供简历文本内容和模板名称生成 PDF 简历。

### 分析简历文本

使用 `mcp_novacv_analyze_resume_text` 命令分析纯文本简历内容。

### 转换简历文本为 JSON Resume

使用 `mcp_novacv_convert_resume_text` 命令将简历文本转换为结构化的 JSON Resume 格式。

## 开发

```bash
# 安装依赖
npm install

# 开发模式（监视文件变化）
npm run dev

# 构建项目
npm run build

# 运行服务（构建并启动）
npm run run

# 使用 MCP Inspector 调试（构建并启动Inspector）
npm run debug
```

## 故障排除

如果您在设置过程中遇到问题:

1. 确认包安装成功: `npx mcp-server-novacv --version`
2. 检查 API 密钥是否正确设置
3. 查看客户端日志中是否有相关错误信息

### API 密钥问题

如果遇到 API 密钥相关错误：

- 确保您已从 [https://api.nova-cv.com](https://api.nova-cv.com) 获取了有效的 API 密钥
- 检查密钥是否已过期或超出使用限制
- 尝试重新生成新的 API 密钥
- 确保环境变量或配置文件中的密钥没有多余的空格或引号

## 许可证

MIT 
