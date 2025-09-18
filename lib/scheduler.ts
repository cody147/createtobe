/**
 * 任务调度和重试逻辑
 */
import { GenTask, BatchState, GenerateRequest, GenerateResponse } from './types';

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 调用生成接口
 */
async function callGenerateApi(prompt: string): Promise<GenerateResponse> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt } as GenerateRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 执行单个任务
 */
async function runSingleTask(
  task: GenTask, 
  state: BatchState,
  onUpdate: (task: GenTask) => void
): Promise<void> {
  task.status = 'generating';
  task.attempts++;
  onUpdate({ ...task });

  try {
    const result = await callGenerateApi(task.prompt);
    
    task.taskId = result.taskId;
    task.imageUrl = result.imageUrl;
    task.status = 'succeeded';
    task.errorMsg = undefined;
    task.selected = false; // 生成成功后自动取消选中状态
    
    state.progress.success++;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 判断是否需要重试
    if (task.attempts < 3 && shouldRetry(errorMessage)) {
      // 指数退避重试
      const delayMs = Math.pow(2, task.attempts - 1) * 1000;
      await delay(delayMs);
      
      task.status = 'idle';
      onUpdate({ ...task });
      
      // 递归重试
      return runSingleTask(task, state, onUpdate);
    } else {
      // 超过重试次数，标记为失败
      task.status = 'failed';
      task.errorMsg = errorMessage;
      state.progress.failed++;
    }
  } finally {
    state.progress.done++;
    onUpdate({ ...task });
  }
}

/**
 * 判断错误是否应该重试
 */
function shouldRetry(errorMessage: string): boolean {
  const retryableErrors = [
    'rate limited',
    'timeout',
    'network',
    'server error',
    'temporary',
    '429',
    '5'
  ];
  
  return retryableErrors.some(keyword => 
    errorMessage.toLowerCase().includes(keyword)
  );
}

/**
 * 工作线程函数
 */
async function worker(
  tasks: GenTask[],
  state: BatchState,
  onUpdate: (task: GenTask) => void
): Promise<void> {
  while (state.isRunning && tasks.length > 0) {
    const task = tasks.shift();
    if (!task) break;
    
    // 处理所有状态为 idle 的任务
    if (task.status === 'idle') {
      await runSingleTask(task, state, onUpdate);
    }
  }
}

/**
 * 运行批量生成任务
 */
export async function runBatchGeneration(
  state: BatchState,
  onUpdate: (task: GenTask) => void
): Promise<void> {
  state.isRunning = true;
  
  // 重置进度
  state.progress.done = 0;
  state.progress.success = 0;
  state.progress.failed = 0;
  
  // 获取待处理的任务（只处理选中的任务，不管之前状态如何）
  const pendingTasks = state.tasks.filter(task => task.selected);
  
  if (pendingTasks.length === 0) {
    state.isRunning = false;
    return;
  }
  
  // 重置所有选中任务的状态，准备重新执行
  pendingTasks.forEach(task => {
    task.status = 'idle';
    task.attempts = 0;
    task.imageUrl = undefined;
    task.errorMsg = undefined;
    task.taskId = undefined;
    onUpdate({ ...task });
  });
  
  // 创建并发工作线程
  const workers: Promise<void>[] = [];
  const taskQueue = [...pendingTasks];
  
  for (let i = 0; i < state.concurrency; i++) {
    workers.push(worker(taskQueue, state, onUpdate));
  }
  
  // 等待所有工作线程完成
  await Promise.all(workers);
  
  // 任务完成后，重置运行状态
  state.isRunning = false;
}

/**
 * 停止批量生成
 */
export function stopBatchGeneration(state: BatchState): void {
  state.isRunning = false;
  
  // 将正在生成的任务标记为停止
  state.tasks.forEach(task => {
    if (task.status === 'generating') {
      task.status = 'stopped';
    }
  });
}

/**
 * 重试失败的任务
 */
export async function retryFailedTasks(
  state: BatchState,
  onUpdate: (task: GenTask) => void
): Promise<void> {
  const failedTasks = state.tasks.filter(task => task.status === 'failed');
  
  if (failedTasks.length === 0) {
    return;
  }
  
  // 重置失败任务状态
  failedTasks.forEach(task => {
    task.status = 'idle';
    task.errorMsg = undefined;
  });
  
  // 运行重试
  await runBatchGeneration(state, onUpdate);
}





