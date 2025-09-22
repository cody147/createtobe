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
 * 将File对象转换为base64 URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * 调用生成接口 - 按照 API_REQUEST_EXAMPLE.md 格式
 */
async function callGenerateApi(prompt: string, referenceImages?: File[]): Promise<GenerateResponse> {
  // 构建消息内容 - 按照Python代码格式
  let content: Array<{type: string, text?: string, image_url?: {url: string}}> = [
    {"type": "text", "text": prompt}
  ];
  
  let newPrompt = prompt;

  
  // 添加图片（支持File对象）
  if (referenceImages && referenceImages.length > 0) {
    for (let index = 0; index < referenceImages.length; index++) {
      const img = referenceImages[index];
      
      // 检查prompt中是否包含文件名
      const fileName = img.name.replace(/\.[^/.]+$/, ''); // 去掉文件扩展名
      const isFileNameInPrompt = prompt.toLowerCase().includes(fileName.toLowerCase());
      
      if (!isFileNameInPrompt) {
        console.log(`跳过图片 ${img.name}：prompt中不包含文件名 ${fileName}`);
        continue;
      }
      
      try {
        // 将File对象转换为base64
        const base64Url = await fileToBase64(img);
        if (base64Url) {
          content.push({
            "type": "image_url",
            "image_url": {"url": base64Url}
          });
          newPrompt += `\n${fileName}使用图${index + 1}中角色图片`;
          // 记录路径信息用于日志
          console.log(`添加参考图片: ${fileName}`);
        } else {
          console.warn(`参考图片转换base64失败: ${img.name}`);
        }
      } catch (error) {
        console.warn(`处理参考图片失败: ${img.name}`, error);
      }
    }
  }

  // 更新content中的文本内容
  content[0] = {"type": "text", "text": newPrompt};

  console.log(`更改后的prompt: ${newPrompt}`);

  // 获取API密钥
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'sk-xxxx';
  
  // 构建请求头 - 按照示例格式
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${apiKey}`);
  myHeaders.append("Content-Type", "application/json");

  // 构建请求体 - 按照Python代码格式
  const raw = JSON.stringify({
    "model": "sora_image",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": content
      }
    ],
    "stream": false
  });

  // 构建请求选项 - 按照示例格式
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow' as RequestRedirect
  };

  // 发送请求 - 按照示例格式
  const response = await fetch("https://ismaque.org/v1/chat/completions", requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API error:', errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  // 处理响应 - 按照Python代码格式解析
  const data = await response.json();
  console.log('API response:', data);

  try {
    // 检查错误响应格式
    if (data.error) {
      throw new Error(`API Error: ${data.error}`);
    }

    // 从返回的markdown中提取图片URL - 按照Python代码逻辑
    const content = data["choices"][0]["message"]["content"];
    console.log('Response content:', content);

    // 尝试两种格式的图片URL - 按照Python代码逻辑
    let imageUrl = '';
    
    // 尝试匹配 [点击下载](url) 格式
    const downloadMatch = content.match(/\[点击下载\]\((.*?)\)/);
    if (downloadMatch) {
      imageUrl = downloadMatch[1];
      console.log('成功提取图片URL (点击下载格式):', imageUrl);
    } else {
      // 尝试匹配 ![图片](url) 格式
      const imageMatch = content.match(/!\[图片\]\((.*?)\)/);
      if (imageMatch) {
        imageUrl = imageMatch[1];
        console.log('成功提取图片URL (图片格式):', imageUrl);
      }
    }

    if (!imageUrl) {
      const errorMsg = "响应中没有找到图片URL";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 生成任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      taskId,
      imageUrl: imageUrl
    };
  } catch (parseError) {
    console.error('Failed to parse API response:', parseError);
    throw new Error('Failed to parse API response');
  }
}

/**
 * 执行单个任务
 */
async function runSingleTask(
  task: GenTask, 
  state: BatchState,
  onUpdate: (task: GenTask) => void,
  referenceImages?: File[]
): Promise<void> {
  task.status = 'generating';
  task.attempts++;
  onUpdate({ ...task });

  try {
    const result = await callGenerateApi(task.prompt, referenceImages);
    
    task.taskId = result.taskId;
    task.imageUrl = result.imageUrl;
    task.status = 'succeeded';
    task.errorMsg = undefined;
    task.selected = false; // 生成成功后自动取消选中状态
    
    state.progress.success++;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 判断是否需要重试
    if (task.attempts < 0 && shouldRetry(errorMessage)) {
      // 指数退避重试
      const delayMs = Math.pow(2, task.attempts - 1) * 1000;
      await delay(delayMs);
      
      task.status = 'idle';
      onUpdate({ ...task });
      
      // 递归重试
      return runSingleTask(task, state, onUpdate, referenceImages);
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
  onUpdate: (task: GenTask) => void,
  referenceImages?: File[]
): Promise<void> {
  while (state.isRunning && tasks.length > 0) {
    const task = tasks.shift();
    if (!task) break;
    
    // 处理所有状态为 idle 的任务
    if (task.status === 'idle') {
      await runSingleTask(task, state, onUpdate, referenceImages);
    }
  }
}

/**
 * 运行批量生成任务
 */
export async function runBatchGeneration(
  state: BatchState,
  onUpdate: (task: GenTask) => void,
  referenceImages?: File[]
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
    workers.push(worker(taskQueue, state, onUpdate, referenceImages));
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





