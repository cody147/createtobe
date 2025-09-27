/**
 * 任务调度和重试逻辑
 */
import { GenTask, BatchState, GenerateRequest, GenerateResponse } from './types';
import { GENERATE_IMAGE_API } from './apipath';

const MAX_ATTEMPTS = 1; // 初始尝试为1

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
    console.log(`🔄 开始读取文件: ${file.name}, 大小: ${file.size} bytes`);
    
    // 检查文件是否已经被读取过
    if (file.size === 0) {
      console.warn(`⚠️ 文件 ${file.name} 大小为0，可能已被读取过`);
      reject(new Error('File has been consumed or is empty'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        console.log(`✅ 文件 ${file.name} 读取成功，base64长度: ${reader.result.length}`);
        resolve(reader.result);
      } else {
        console.error(`❌ 文件 ${file.name} 读取结果不是字符串`);
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => {
      console.error(`❌ 文件 ${file.name} 读取失败:`, error);
      reject(new Error('FileReader error'));
    };
    
    console.log(`📖 开始读取文件内容...`);
    reader.readAsDataURL(file);
  });
}

/**
 * 调用生成接口 - 按照 API_REQUEST_EXAMPLE.md 格式
 */
async function callGenerateApi(prompt: string, referenceImages?: File[], settings?: { apiKey: string; style?: any; aspectRatio?: string }, abortController?: AbortController): Promise<GenerateResponse> {
  // 调试信息：检查参考图传递情况
  console.log('🔍 callGenerateApi 接收到的参数:');
  console.log('- prompt:', prompt.substring(0, 100) + '...');
  console.log('- referenceImages:', referenceImages);
  console.log('- referenceImages length:', referenceImages?.length || 0);
  if (referenceImages && referenceImages.length > 0) {
    referenceImages.forEach((img, index) => {
      console.log(`- 参考图 ${index + 1}: ${img.name} (${img.size} bytes)`);
    });
  }
  
  // 构建消息内容 - 按照Python代码格式
  let content: Array<{type: string, text?: string, image_url?: {url: string}}> = [
    {"type": "text", "text": prompt}
  ];
  
  let newPrompt = prompt;

  
  // 添加图片（支持File对象）
  if (referenceImages && referenceImages.length > 0) {
    console.log(`🖼️ 开始处理 ${referenceImages.length} 张参考图`);
    let picIndex = 1;
    for (let index = 0; index < referenceImages.length; index++) {
      const img = referenceImages[index];
      console.log(`🖼️ 处理参考图 ${index + 1}/${referenceImages.length}: ${img.name}`);
      
      // 检查prompt中是否包含文件名
      const fileName = img.name.replace(/\.[^/.]+$/, ''); // 去掉文件扩展名
      const isFileNameInPrompt = prompt.toLowerCase().includes(fileName.toLowerCase());
      
      console.log(`🔍 检查匹配: 文件名=${fileName}, 在prompt中=${isFileNameInPrompt}`);
      
      if (!isFileNameInPrompt) {
        console.log(`跳过图片 ${img.name}：prompt中不包含文件名 ${fileName}`);
        continue;
      }
      
      try {
        console.log(`🔄 开始转换图片 ${img.name} 为base64...`);
        // 将File对象转换为base64
        const base64Url = await fileToBase64(img);
        if (base64Url) {
          content.push({
            "type": "image_url",
            "image_url": {"url": base64Url}
          });
          newPrompt += `\n${fileName}使用图${picIndex++}中角色图片`;
          // 记录路径信息用于日志
          console.log(`✅ 成功添加参考图片: ${fileName}`);
        } else {
          console.warn(`❌ 参考图片转换base64失败: ${img.name}`);
        }
      } catch (error) {
        console.warn(`❌ 处理参考图片失败: ${img.name}`, error);
      }
    }
    console.log(`🖼️ 参考图处理完成，共处理 ${picIndex - 1} 张图片`);
  } else {
    console.log(`🖼️ 没有参考图需要处理`);
  }

  // 添加用户设置的生成风格和图片比例
  if (settings?.style && settings.style.name !== '系统默认') {
    newPrompt += `\n\n生成风格: ${settings.style.content}`;
  }
  
  if (settings?.aspectRatio) {
    const ratioMap: Record<string, string> = {
      '3:2': '横屏比例 3:2',
      '2:3': '竖屏比例 2:3', 
      '9:16': '手机竖屏比例 9:16'
    };
    newPrompt += `\n\n图片比例: ${ratioMap[settings.aspectRatio]}`;
  }

  // 更新content中的文本内容
  content[0] = {"type": "text", "text": newPrompt};

  console.log(`更改后的prompt: ${newPrompt}`);

  // 检查API密钥
  if (!settings?.apiKey || settings.apiKey.trim() === '') {
    throw new Error('请先在设置中配置API密钥');
  }
  
  // 构建请求头 - 使用用户设置的API密钥
  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${settings.apiKey}`);
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
  const response = await fetch(GENERATE_IMAGE_API, {
    ...requestOptions,
    signal: abortController?.signal
  });

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
  referenceImages?: File[],
  settings?: { apiKey: string; style?: any; aspectRatio?: string }
): Promise<void> {
  console.log(`🎬 开始执行任务 ${task.id}, 当前状态: ${task.status}`);
  
  // 检查是否已经停止
  if (!state.isRunning) {
    console.log(`🛑 任务 ${task.id} 被停止，跳过执行`);
    task.status = 'stopped';
    onUpdate({ ...task });
    return;
  }
  
  task.status = 'generating';
  task.attempts++;
  console.log(`🔄 更新任务状态为 generating, 尝试次数: ${task.attempts}`);
  onUpdate({ ...task });

  try {
    console.log(`🚀 调用生成API, prompt: ${task.prompt.substring(0, 50)}...`);
    console.log(`📸 传递给 callGenerateApi 的参考图:`, referenceImages);
    console.log(`📸 参考图数量:`, referenceImages?.length || 0);
    const result = await callGenerateApi(task.prompt, referenceImages, settings, state.abortController);
    
    // 检查是否在API调用期间被停止
    if (!state.isRunning) {
      console.log(`🛑 任务 ${task.id} 在API调用后被停止`);
      task.status = 'stopped';
      onUpdate({ ...task });
      return;
    }
    
    console.log(`✅ 生成成功, taskId: ${result.taskId}, imageUrl: ${result.imageUrl}`);
    task.taskId = result.taskId;
    task.imageUrl = result.imageUrl;
    task.status = 'succeeded';
    task.errorMsg = undefined;
    task.selected = false; // 生成成功后自动取消选中状态
    
    state.progress.success++;
    console.log(`🎉 任务 ${task.id} 执行成功`);
  } catch (error) {
    // 检查是否被停止
    if (!state.isRunning) {
      console.log(`🛑 任务 ${task.id} 在错误处理时被停止`);
      task.status = 'stopped';
      onUpdate({ ...task });
      return;
    }
    
    // 检查是否是AbortError（请求被取消）
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`🛑 任务 ${task.id} 的API请求被取消`);
      task.status = 'stopped';
      onUpdate({ ...task });
      return;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ 任务 ${task.id} 执行失败:`, errorMessage);
    
    // 判断是否需要重试
    if (task.attempts < MAX_ATTEMPTS && shouldRetry(errorMessage)) {
      console.log(`🔄 准备重试任务 ${task.id}, 当前尝试次数: ${task.attempts}`);
      // 指数退避重试
      const delayMs = Math.pow(2, task.attempts - 1) * 1000;
      await delay(delayMs);
      
      // 检查是否在重试延迟期间被停止
      if (!state.isRunning) {
        console.log(`🛑 任务 ${task.id} 在重试延迟后被停止`);
        task.status = 'stopped';
        onUpdate({ ...task });
        return;
      }
      
      task.status = 'idle';
      onUpdate({ ...task });
      
      // 递归重试
      return runSingleTask(task, state, onUpdate, referenceImages, settings);
    } else {
      // 超过重试次数，标记为失败
      console.log(`💀 任务 ${task.id} 重试次数已用完，标记为失败`);
      task.status = 'failed';
      task.errorMsg = errorMessage;
      state.progress.failed++;
    }
  } finally {
    // 只有在任务真正完成时才更新进度
    if (task.status === 'succeeded' || task.status === 'failed') {
      state.progress.done++;
    }
    console.log(`🏁 任务 ${task.id} 完成，最终状态: ${task.status}`);
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
  referenceImages?: File[],
  settings?: { apiKey: string; style?: any; aspectRatio?: string }
): Promise<void> {
  console.log(`🔧 工作线程启动, 待处理任务数: ${tasks.length}, 运行状态: ${state.isRunning}`);
  console.log(`📸 工作线程接收到的参考图:`, referenceImages);
  console.log(`📸 工作线程参考图数量:`, referenceImages?.length || 0);
  if (referenceImages && referenceImages.length > 0) {
    referenceImages.forEach((img, index) => {
      console.log(`- 工作线程参考图 ${index + 1}: ${img.name} (${img.size} bytes)`);
    });
  }
  
  while (state.isRunning && tasks.length > 0) {
    const task = tasks.shift();
    if (!task) {
      console.log('🔚 工作线程: 没有更多任务');
      break;
    }
    
    console.log(`📋 工作线程: 处理任务 ${task.id}, 状态: ${task.status}`);
    
    // 处理所有状态为 idle 的任务
    if (task.status === 'idle') {
      console.log(`✅ 工作线程: 任务 ${task.id} 状态为 idle，开始执行`);
      await runSingleTask(task, state, onUpdate, referenceImages, settings);
    } else {
      console.log(`⏭️ 工作线程: 跳过任务 ${task.id}，状态为 ${task.status}`);
    }
  }
  
  console.log('🏁 工作线程结束');
}

/**
 * 运行批量生成任务
 */
export async function runBatchGeneration(
  state: BatchState,
  onUpdate: (task: GenTask) => void,
  referenceImages?: File[],
  settings?: { apiKey: string; style?: any; aspectRatio?: string }
): Promise<void> {
  console.log('🚀 runBatchGeneration 开始执行');
  console.log('📊 当前状态:', {
    isRunning: state.isRunning,
    concurrency: state.concurrency,
    totalTasks: state.tasks.length
  });
  console.log('📸 接收到的参考图:', referenceImages);
  console.log('📸 参考图数量:', referenceImages?.length || 0);
  if (referenceImages && referenceImages.length > 0) {
    referenceImages.forEach((img, index) => {
      console.log(`- 参考图 ${index + 1}: ${img.name} (${img.size} bytes)`);
    });
  }
  
  state.isRunning = true;
  
  // 创建新的AbortController
  state.abortController = new AbortController();
  console.log('🎛️ 创建新的AbortController');
  
  // 重置进度
  state.progress.done = 0;
  state.progress.success = 0;
  state.progress.failed = 0;
  
  // 获取待处理的任务（只处理选中的任务，不管之前状态如何）
  const pendingTasks = state.tasks.filter(task => task.selected);
  console.log(`📋 找到 ${pendingTasks.length} 个选中的任务`);
  
  if (pendingTasks.length === 0) {
    console.log('⚠️ 没有选中的任务，退出');
    state.isRunning = false;
    return;
  }
  
  // 重置所有选中任务的状态，准备重新执行
  console.log('🔄 重置所有选中任务的状态');
  pendingTasks.forEach(task => {
    console.log(`重置任务 ${task.id}: ${task.status} -> idle`);
    task.status = 'idle';
    task.attempts = 0;
    task.imageUrl = undefined;
    task.errorMsg = undefined;
    task.taskId = undefined;
    onUpdate({ ...task });
  });
  
  // 创建并发工作线程 - 修复参考图传递问题
  const workers: Promise<void>[] = [];
  const workerCount = Math.min(state.concurrency, pendingTasks.length);
  console.log(`🔧 创建 ${workerCount} 个工作线程，任务队列长度: ${pendingTasks.length}`);

  // 为每个工作线程创建独立的任务队列
  for (let i = 0; i < workerCount; i++) {
    // 为每个工作线程分配任务
    const workerTasks = pendingTasks.filter((_, index) => index % workerCount === i);
    console.log(`🔧 工作线程 ${i + 1} 分配了 ${workerTasks.length} 个任务`);
    
    // 创建独立的任务队列副本，避免多线程竞态条件
    const taskQueue = [...workerTasks];
    
    // 为每个工作线程传递参考图的深拷贝，避免共享状态问题
    // 注意：File 对象在 JavaScript 中只能被读取一次，所以需要特殊处理
    const workerReferenceImages = referenceImages ? [...referenceImages] : undefined;
    console.log(`🔧 工作线程 ${i + 1} 分配的参考图:`, workerReferenceImages?.length || 0);
    
    workers.push(worker(taskQueue, state, onUpdate, workerReferenceImages, settings));
  }
  
  // 等待所有工作线程完成
  console.log('⏳ 等待所有工作线程完成...');
  await Promise.all(workers);
  console.log('✅ 所有工作线程完成');
  
  // 任务完成后，重置运行状态
  state.isRunning = false;
  console.log('🏁 runBatchGeneration 执行完成');
}

/**
 * 停止批量生成
 */
export function stopBatchGeneration(state: BatchState): void {
  console.log('🛑 停止批量生成被调用');
  console.log('📊 停止前状态:', {
    isRunning: state.isRunning,
    generatingTasks: state.tasks.filter(t => t.status === 'generating').length,
    totalTasks: state.tasks.length
  });
  
  state.isRunning = false;
  
  // 取消所有正在进行的API请求
  if (state.abortController) {
    console.log('🛑 取消所有正在进行的API请求');
    state.abortController.abort();
    state.abortController = undefined;
  }
  
  // 将正在生成的任务标记为停止
  let stoppedCount = 0;
  state.tasks.forEach(task => {
    if (task.status === 'generating') {
      task.status = 'stopped';
      stoppedCount++;
      console.log(`🛑 任务 ${task.id} 被标记为停止`);
    }
  });
  
  console.log(`🛑 批量生成已停止，共停止了 ${stoppedCount} 个正在运行的任务`);
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


