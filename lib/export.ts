/**
 * 导出结果 CSV 功能
 */
import { GenTask, ExportRow } from './types';

/**
 * 导出任务结果为 CSV
 */
export function exportTasksToCsv(tasks: GenTask[]): string {
  const headers = ['序号', '提示词', '状态', '尝试次数', '图片URL', '错误信息'];
  const rows = tasks.map(task => exportTaskToRow(task));
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => [
      row.id,
      `"${row.prompt.replace(/"/g, '""')}"`, // 转义引号
      row.status,
      row.attempts,
      row.imageUrl || '',
      `"${(row.errorMsg || '').replace(/"/g, '""')}"` // 转义引号
    ].join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * 将任务转换为导出行
 */
function exportTaskToRow(task: GenTask): ExportRow {
  return {
    id: task.id,
    prompt: task.prompt,
    status: task.status,
    imageUrl: task.imageUrl,
    errorMsg: task.errorMsg,
    attempts: task.attempts
  };
}

/**
 * 下载 CSV 文件
 */
export function downloadCsv(csvContent: string, filename: string = 'batch-generate-results.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * 导出所有任务（包括成功和失败的）
 */
export function exportAllTasks(tasks: GenTask[]): void {
  const csvContent = exportTasksToCsv(tasks);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `batch-generate-results-${timestamp}.csv`;
  
  downloadCsv(csvContent, filename);
}

/**
 * 仅导出成功的任务
 */
export function exportSuccessfulTasks(tasks: GenTask[]): void {
  const successfulTasks = tasks.filter(task => task.status === 'succeeded');
  const csvContent = exportTasksToCsv(successfulTasks);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `successful-tasks-${timestamp}.csv`;
  
  downloadCsv(csvContent, filename);
}

/**
 * 导出失败的任务
 */
export function exportFailedTasks(tasks: GenTask[]): void {
  const failedTasks = tasks.filter(task => task.status === 'failed');
  const csvContent = exportTasksToCsv(failedTasks);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `failed-tasks-${timestamp}.csv`;
  
  downloadCsv(csvContent, filename);
}




