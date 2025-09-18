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
}

// 生成接口请求
export interface GenerateRequest {
  prompt: string;
}

// 生成接口响应
export interface GenerateResponse {
  taskId: string;
  imageUrl: string;
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




