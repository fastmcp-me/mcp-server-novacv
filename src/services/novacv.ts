import axios from 'axios';
import type { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'node:fs';

interface ResumeOptions {
  [key: string]: any;
}

interface GenerateResumeResponse {
  success: boolean;
  message?: string;
  data?: {
    fileUrl: string;
    fileId: string;
    fileName: string;
    templateName: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

interface Template {
  id: string;
  name: string;
  thumbnail: string;
  [key: string]: any;
}

interface ConvertResponse {
  success: boolean;
  message?: string;
  data?: {
    resumeData?: any;
    jsonResume?: any;
  };
  error?: {
    message: string;
    code: string;
  };
  resumeData?: any;
  jsonResume?: any;
}

interface AnalyzeResponse {
  analysis: any;
  [key: string]: any;
}

export class NovaCVService {
  private apiKey: string;
  private baseURL: string;
  private client: AxiosInstance;

  constructor(
    apiKey: string, 
    baseURL: string = 'https://api.nova-cv.com',
    timeout: number = 30000
  ) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: timeout
    });
  }

  /**
   * 生成简历PDF
   * @param resumeData - 符合JSON Resume标准的简历数据
   * @param templateName - 要使用的简历模板名称
   * @param options - 生成选项
   * @returns 返回API原始响应
   */
  async generateResume(
    resumeData: any, 
    templateName: string = 'elite', 
    options: any = {}
  ): Promise<any> {
    try {
      // 基本检查，确保数据不为空
      if (!resumeData) {
        throw new Error("resumeData 不能为空");
      }
      
      // 确保resumeData是对象格式
      let processedResumeData: any;
      if (typeof resumeData === 'string') {
        try {
          processedResumeData = JSON.parse(resumeData);
        } catch (e: any) {
          throw new Error(`无法解析resumeData字符串为JSON: ${e.message}`);
        }
      } else {
        processedResumeData = resumeData;
      }
      
      // 构建请求数据对象
      const requestData = {
        resumeData: processedResumeData,
        templateName,
        options
      };
      
      // 发送请求到NovaCV API
      const response = await this.client.post('/api/v1/resumes/generate', requestData);
      
      return response.data;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  /**
   * 获取所有可用的简历模板
   * @returns 返回API原始响应
   */
  async getTemplates(): Promise<any> {
    try {
      const response = await this.client.get('/api/v1/templates');
      return response.data;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  /**
   * 获取简历文件URL
   * @param fileId - 简历文件的唯一标识符
   * @returns 返回完整的文件URL
   */
  getResumeFileUrl(fileId: string): string {
    return `${this.baseURL}/api/v1/resumes/file/${fileId}`;
  }

  /**
   * 将文本转换为JSON Resume格式
   * @param resumeText - 简历文本内容
   * @returns 返回API原始响应
   */
  async convertTextToJsonResume(resumeText: string): Promise<any> {
    try {
      console.log("开始转换简历文本为JSON格式");
      const response = await this.client.post('/api/v1/resumes/convert-text', {
        resumeText
      });
      console.log("转换API响应状态码:", response.status);
      console.log("转换API响应头:", JSON.stringify(response.headers, null, 2));
      console.log("转换API响应数据类型:", typeof response.data);
      
      // 如果直接返回简历数据，自动包装为标准格式
      if (response.data && typeof response.data === 'object') {
        // 检查是否缺少标准响应结构
        if (!response.data.success && !response.data.data && !response.data.error) {
          // 检查是否是简历数据结构
          if (response.data.basics || response.data.work || response.data.education) {
            return {
              success: true,
              data: {
                jsonResume: response.data
              }
            };
          }
        } 
        // 标准化响应 - 确保jsonResume数据在一致的位置
        else if (response.data.success && response.data.data) {
          // 如果有data.resumeData但没有data.jsonResume，复制数据
          if (response.data.data.resumeData && !response.data.data.jsonResume) {
            response.data.data.jsonResume = response.data.data.resumeData;
          }
          // 如果有data.jsonResume但没有data.resumeData，复制数据
          else if (response.data.data.jsonResume && !response.data.data.resumeData) {
            response.data.data.resumeData = response.data.data.jsonResume;
          }
        }
      }
      
      return response.data;
    } catch (error) {
      console.error("转换简历文本失败:", error);
      this._handleError(error);
      throw error;
    }
  }

  /**
   * 分析简历文本
   * @param resumeText - 简历文本内容
   * @returns 返回API原始响应
   */
  async analyzeResumeText(resumeText: string): Promise<any> {
    try {
      const response = await this.client.post('/api/v1/resumes/analyze', {
        resumeText
      });
      return response.data;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  /**
   * 处理API错误
   * @private
   * @param error - 错误对象
   */
  private _handleError(error: any): never {
    if (error.response) {
      const { status, data } = error.response;
      throw new Error(`NovaCV API 错误 (${status}): ${data.message || JSON.stringify(data)}`);
    } else if (error.request) {
      throw new Error(`NovaCV API 请求失败: ${error.message}`);
    } else {
      throw new Error(`NovaCV 错误: ${error.message}`);
    }
  }
} 