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

/**
 * 下载单个图片
 */
async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    console.log(`开始下载图片: ${filename}`);
    console.log(`图片URL: ${url}`);
    
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log(`HTTP响应状态: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log(`图片Blob创建成功，大小: ${blob.size} bytes, 类型: ${blob.type}`);
    
    const downloadUrl = URL.createObjectURL(blob);
    console.log(`创建下载URL: ${downloadUrl}`);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.visibility = 'hidden';
    
    console.log('添加下载链接到DOM');
    document.body.appendChild(link);
    
    console.log('触发点击下载');
    link.click();
    
    console.log('清理DOM和URL');
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    
    console.log(`图片 ${filename} 下载完成`);
  } catch (error) {
    console.error(`Failed to download image ${filename}:`, error);
    throw error;
  }
}

/**
 * 获取文件扩展名
 */
function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split('.').pop();
    return extension ? `.${extension}` : '.jpg';
  } catch {
    return '.jpg';
  }
}

/**
 * 下载单张图片（使用新的命名规则）
 */
export async function downloadSingleImage(
  task: GenTask, 
  originalCsvFilename?: string
): Promise<void> {
  if (!task.imageUrl) {
    throw new Error('图片URL不存在');
  }

  const extension = getFileExtension(task.imageUrl);
  
  // 使用新的命名规则：CSV文件名 + 图片编号
  let filename: string;
  if (originalCsvFilename) {
    // 移除原始文件扩展名
    const baseName = originalCsvFilename.replace(/\.[^/.]+$/, '');
    filename = `${baseName}_${task.id.toString().padStart(3, '0')}${extension}`;
  } else {
    filename = `image_${task.id.toString().padStart(3, '0')}${extension}`;
  }

  await downloadImage(task.imageUrl, filename);
}

/**
 * 导出所有任务（包括CSV和分别下载所有图片）
 */
export async function exportAllTasksWithImages(tasks: GenTask[], originalCsvFilename?: string): Promise<void> {
  try {
    console.log('=== 开始导出任务 ===');
    console.log('总任务数:', tasks.length);
    
    // 先下载CSV文件
    const csvContent = exportTasksToCsv(tasks);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    // 使用新的命名规则：原始文件名 + 保存时间
    let csvFilename: string;
    if (originalCsvFilename) {
      // 移除原始文件扩展名，添加时间戳和.csv扩展名
      const baseName = originalCsvFilename.replace(/\.[^/.]+$/, '');
      csvFilename = `${baseName}_${timestamp}.csv`;
    } else {
      csvFilename = `batch-generate-results_${timestamp}.csv`;
    }
    
    console.log('开始下载CSV文件:', csvFilename);
    downloadCsv(csvContent, csvFilename);
    console.log('CSV文件下载已触发');
    
    // 获取所有成功的任务图片
    const successfulTasks = tasks.filter(task => 
      task.status === 'succeeded' && task.imageUrl
    );
    
    console.log('成功的任务数量:', successfulTasks.length);
    console.log('成功的任务详情:', successfulTasks.map(t => ({ 
      id: t.id, 
      imageUrl: t.imageUrl,
      status: t.status 
    })));
    
    if (successfulTasks.length > 0) {
      console.log('开始下载图片...');
      
      // 逐个下载图片
      for (let i = 0; i < successfulTasks.length; i++) {
        const task = successfulTasks[i];
        try {
          console.log(`正在下载第 ${i + 1}/${successfulTasks.length} 张图片 - 任务ID: ${task.id}`);
          console.log('图片URL:', task.imageUrl);
          
          const extension = getFileExtension(task.imageUrl!);
          
          // 使用新的命名规则：CSV文件名 + 图片编号
          let filename: string;
          if (originalCsvFilename) {
            // 移除原始文件扩展名
            const baseName = originalCsvFilename.replace(/\.[^/.]+$/, '');
            filename = `${baseName}_${task.id.toString().padStart(3, '0')}${extension}`;
          } else {
            filename = `image_${task.id.toString().padStart(3, '0')}${extension}`;
          }
          
          console.log('文件名:', filename);
          
          await downloadImage(task.imageUrl!, filename);
          console.log(`任务 ${task.id} 图片下载完成`);
          
          // 添加小延迟避免浏览器阻止多个下载
          if (i < successfulTasks.length - 1) {
            console.log('等待100ms后下载下一张图片...');
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`任务 ${task.id} 图片下载失败:`, error);
          // 继续下载其他图片
        }
      }
      
      console.log('所有图片下载处理完成');
    } else {
      console.log('没有成功的任务，跳过图片下载');
    }
    
    console.log('=== 导出任务完成 ===');
    
  } catch (error) {
    console.error('导出过程中发生错误:', error);
    throw error;
  }
}




