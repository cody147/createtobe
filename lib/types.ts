/**
 * 批量文生图应用的类型定义
 */

// CSV 每行映射
export interface CsvRow {
  id: number;               // 第一列"序号"
  prompt: string;           // 第二列"提示词"
}

// 任务状态枚举
export type TaskStatus = 'idle' | 'generating' | 'succeeded' | 'failed' | 'stopped';

// 前端任务行
export interface GenTask extends CsvRow {
  taskId?: string;          // 后端返回的任务ID（若有）
  status: TaskStatus;
  attempts: number;         // 已重试次数
  imageUrl?: string;        // 生成结果
  errorMsg?: string;        // 失败原因
  selected: boolean;        // 是否被选中
}

// 批量生成状态
export interface BatchState {
  tasks: GenTask[];
  concurrency: number;      // 默认 1；可支持 1~3
  isRunning: boolean;
  originalCsvFilename?: string; // 原始CSV文件名
  progress: {
    total: number;
    done: number;
    success: number;
    failed: number;
  };
}

// CSV 解析结果
export interface CsvParseResult {
  validRows: CsvRow[];
  invalidRows: number;
  totalRows: number;
  errors: string[];
  originalFilename?: string; // 原始文件名
}

// 生成接口请求
export interface GenerateRequest {
  prompt: string;
  referenceImages?: File[];
  apiKey: string;
  style?: StyleOption;
  aspectRatio?: AspectRatio;
}

// 生成接口响应
export interface GenerateResponse {
  taskId: string;
  imageUrl: string;
  previewUrl?: string;
  sourceUrl?: string;
}

// API 错误响应
export interface ApiErrorResponse {
  error: {
    message: string;
    type: string;
  };
}

// 外部API响应 - 按照你的示例格式
export interface ExternalApiResponse {
  id?: string;
  preview_url?: string;
  source_url?: string;
  error?: string; // 错误响应可能包含error字段
}

// 错误响应
export interface ErrorResponse {
  error: string;
  message?: string;
}

// 导出结果行
export interface ExportRow {
  id: number;
  prompt: string;
  status: TaskStatus;
  imageUrl?: string;
  errorMsg?: string;
  attempts: number;
}

// 风格选项
export interface StyleOption {
  name: string;
  content: string;
}

// 图片比例选项
export type AspectRatio = '3:2' | '2:3' | '9:16';

// 应用设置
export interface AppSettings {
  concurrency: number;
  style: StyleOption;
  aspectRatio: AspectRatio;
  apiKey: string;
}




