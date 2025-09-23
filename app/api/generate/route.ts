import { NextRequest, NextResponse } from 'next/server';
import { GenerateRequest, GenerateResponse, ErrorResponse, ExternalApiResponse, ApiErrorResponse, AppSettings } from '@/lib/types';

// API 配置
const API_URL = 'https://asyncdata.net/tran/https://api.apicore.ai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: prompt is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    // 检查用户设置的API密钥
    if (!body.apiKey || body.apiKey.trim() === '') {
      return NextResponse.json(
        { error: '请先在设置中配置API密钥' } as ErrorResponse,
        { status: 400 }
      );
    }

    // 构建请求内容
    let content = body.prompt;
    
    // 添加生成风格到提示词
    if (body.style && body.style.name !== '系统默认') {
      content += `\n\n生成风格: ${body.style.content}`;
    }
    
    // 添加图片比例到提示词
    if (body.aspectRatio) {
      const ratioMap = {
        '3:2': '横屏比例 3:2',
        '2:3': '竖屏比例 2:3', 
        '9:16': '手机竖屏比例 9:16'
      };
      content += `\n\n图片比例: ${ratioMap[body.aspectRatio]}`;
    }
    
    // 如果有参考图，添加参考图信息到prompt中
    if (body.referenceImages && body.referenceImages.length > 0) {
      content += `\n\n参考图片数量: ${body.referenceImages.length}张`;
      body.referenceImages.forEach((img, index) => {
        content += `\n参考图${index + 1}: ${img.name}`;
      });
    }

    // 构建请求体 - 按照你的示例格式
    const requestBody = {
      model: "gpt-4o-image-async",
      stream: true,
      messages: [
        {
          role: "user",
          content: content
        }
      ]
    };

    // 构建请求头 - 使用用户提供的API密钥
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${body.apiKey}`);
    myHeaders.append("Content-Type", "application/json");

    // 构建请求选项 - 按照你的示例格式
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(requestBody),
      redirect: 'follow' as RequestRedirect
    };

    // 发送请求到外部API - 按照你的示例格式
    const response = await fetch(API_URL, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', errorText);
      
      try {
        const errorData = JSON.parse(errorText) as ApiErrorResponse;
        return NextResponse.json(
          { error: `API Error: ${errorData.error.message}` } as ErrorResponse,
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: `API Error: ${errorText}` } as ErrorResponse,
          { status: response.status }
        );
      }
    }

    // 按照你的示例处理响应
    const result = await response.text();
    console.log('External API response:', result);

    try {
      const apiResponse = JSON.parse(result) as ExternalApiResponse;
      
      // 检查是否有错误响应（按照你的错误示例格式）
      if (apiResponse.error) {
        console.error('API returned error:', apiResponse.error);
        return NextResponse.json(
          { error: `API Error: ${apiResponse.error}` } as ErrorResponse,
          { status: 400 }
        );
      }

      // 检查是否有正确的响应格式（按照你的正确示例格式）
      if (!apiResponse.id || !apiResponse.preview_url || !apiResponse.source_url) {
        console.error('Invalid API response format:', apiResponse);
        return NextResponse.json(
          { error: 'Invalid API response format' } as ErrorResponse,
          { status: 500 }
        );
      }
      
      // 生成任务ID
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response: GenerateResponse = {
        taskId,
        imageUrl: apiResponse.preview_url, // 使用预览URL作为主要图片URL
        previewUrl: apiResponse.preview_url,
        sourceUrl: apiResponse.source_url
      };

      return NextResponse.json(response);
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse API response' } as ErrorResponse,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' } as ErrorResponse,
      { status: 500 }
    );
  }
}

// 处理 OPTIONS 请求（CORS）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}




