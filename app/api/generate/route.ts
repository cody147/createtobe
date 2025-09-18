import { NextRequest, NextResponse } from 'next/server';
import { GenerateRequest, GenerateResponse, ErrorResponse } from '@/lib/types';

// 模拟生成延迟
const GENERATION_DELAY = 2000; // 2秒
const FAILURE_RATE = 0.1; // 10% 失败率

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: prompt is required' } as ErrorResponse,
        { status: 400 }
      );
    }

    // 模拟生成延迟
    await new Promise(resolve => setTimeout(resolve, GENERATION_DELAY));

    // 模拟随机失败
    if (Math.random() < FAILURE_RATE) {
      return NextResponse.json(
        { error: 'Generation failed: Service temporarily unavailable' } as ErrorResponse,
        { status: 500 }
      );
    }

    // 模拟限流
    if (Math.random() < 0.05) { // 5% 限流概率
      return NextResponse.json(
        { error: 'Rate limited: Please slow down your requests' } as ErrorResponse,
        { status: 429 }
      );
    }

    // 生成模拟的图片 URL
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const imageUrl = `https://picsum.photos/512/512?random=${Date.now()}&prompt=${encodeURIComponent(body.prompt)}`;

    const response: GenerateResponse = {
      taskId,
      imageUrl
    };

    return NextResponse.json(response);
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




