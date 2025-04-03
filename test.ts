import http from 'http';

// 简历数据示例
const sampleResumeData = {
  "basics": {
    "name": "张三",
    "label": "软件工程师",
    "email": "zhangsan@example.com",
    "phone": "123-456-7890",
    "summary": "有5年 Web 开发经验的全栈开发者"
  },
  "work": [
    {
      "company": "ABC科技",
      "position": "高级工程师",
      "startDate": "2018-01-01",
      "endDate": "2023-01-01",
      "summary": "负责核心产品的开发与维护"
    }
  ],
  "education": [
    {
      "institution": "某大学",
      "area": "计算机科学",
      "studyType": "本科",
      "startDate": "2014-09-01",
      "endDate": "2018-06-30"
    }
  ]
};

// 简历文本示例
const sampleResumeText = `
张三
软件工程师 | zhangsan@example.com | 123-456-7890

工作经历
高级工程师, ABC科技 (2018年1月 - 2023年1月)
- 负责核心产品的开发与维护
- 带领团队完成产品迭代和功能更新

教育背景
本科, 计算机科学, 某大学 (2014年9月 - 2018年6月)
`;

interface JsonRpcResponse {
  jsonrpc: string;
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// 测试 list_tools
function testListTools(): void {
  const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data) as JsonRpcResponse;
        console.log('List Tools 响应:');
        console.log(response);
        // 成功后测试生成简历
        testGenerateResume();
      } catch (e) {
        console.error('解析响应失败:', e);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`请求遇到问题: ${e.message}`);
  });

  req.write(JSON.stringify({
    jsonrpc: '2.0',
    id: '1',
    method: 'list_tools',
    params: {}
  }));
  req.end();
}

// 测试 generate_resume
function testGenerateResume(): void {
  const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data) as JsonRpcResponse;
        console.log('Generate Resume 响应:');
        console.log(response);
        // 成功后测试转换简历文本
        testConvertResumeText();
      } catch (e) {
        console.error('解析响应失败:', e);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`请求遇到问题: ${e.message}`);
  });

  req.write(JSON.stringify({
    jsonrpc: '2.0',
    id: '2',
    method: 'call_tool',
    params: {
      name: 'generate_resume',
      arguments: {
        resumeData: sampleResumeData,
        templateName: 'elite'
      }
    }
  }));
  req.end();
}

// 测试 convert_resume_text
function testConvertResumeText(): void {
  const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data) as JsonRpcResponse;
        console.log('Convert Resume Text 响应:');
        console.log(response);
        // 最后测试分析简历文本
        testAnalyzeResumeText();
      } catch (e) {
        console.error('解析响应失败:', e);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`请求遇到问题: ${e.message}`);
  });

  req.write(JSON.stringify({
    jsonrpc: '2.0',
    id: '3',
    method: 'call_tool',
    params: {
      name: 'convert_resume_text',
      arguments: {
        resumeText: sampleResumeText
      }
    }
  }));
  req.end();
}

// 测试 analyze_resume_text
function testAnalyzeResumeText(): void {
  const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const response = JSON.parse(data) as JsonRpcResponse;
        console.log('Analyze Resume Text 响应:');
        console.log(response);
        console.log('所有测试完成!');
      } catch (e) {
        console.error('解析响应失败:', e);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`请求遇到问题: ${e.message}`);
  });

  req.write(JSON.stringify({
    jsonrpc: '2.0',
    id: '4',
    method: 'call_tool',
    params: {
      name: 'analyze_resume_text',
      arguments: {
        resumeText: sampleResumeText
      }
    }
  }));
  req.end();
}

console.log('开始测试 NovaCV MCP 服务...');
// 开始测试
testListTools(); 