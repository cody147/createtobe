'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { GenTask } from '@/lib/types';
import { ImageModal } from './ImageModal';
import { EditPromptModal } from './EditPromptModal';

interface TaskCardProps {
  task: GenTask;
  onUpdateTask: (taskId: number, updates: Partial<GenTask>) => void;
  onToggleSelection: (taskId: number) => void;
}

export function TaskCard({ task, onUpdateTask, onToggleSelection }: TaskCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  const getStatusIcon = () => {
    switch (task.status) {
      case 'idle':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'stopped':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'idle':
        return '等待中';
      case 'generating':
        return '生成中';
      case 'succeeded':
        return '成功';
      case 'failed':
        return '失败';
      case 'stopped':
        return '已停止';
      default:
        return task.status;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'idle':
        return 'text-gray-600 bg-gray-100';
      case 'generating':
        return 'text-blue-600 bg-blue-100';
      case 'succeeded':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'stopped':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleSavePrompt = (newPrompt: string) => {
    onUpdateTask(task.id, { prompt: newPrompt });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 清除之前的定时器
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    // 设置新的定时器，300ms后执行单击
    const timeout = setTimeout(() => {
      // 执行选中逻辑
      onToggleSelection(task.id);
      setClickTimeout(null);
    }, 300);

    setClickTimeout(timeout);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 清除单击定时器
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    // 打开编辑弹窗
    setIsEditModalOpen(true);
  };

  const handleDownloadImage = () => {
    if (task.imageUrl) {
      const link = document.createElement('a');
      link.href = task.imageUrl;
      link.download = `task-${task.id}.png`;
      link.click();
    }
  };

  return (
    <div 
      className={`
        grid grid-cols-12 px-4 py-3 transition-all cursor-pointer
        ${task.selected 
          ? 'bg-blue-50' 
          : 'bg-white hover:bg-gray-50'
        }
      `}
      onClick={() => onToggleSelection(task.id)}
    >
      {/* 编号列 */}
      <div className="col-span-1 flex items-center border-r border-gray-200 pr-4">
        <span className="text-sm font-medium text-gray-700">#{task.id}</span>
      </div>

      {/* 提示词列 */}
      <div className="col-span-6 flex items-start border-r border-gray-200 px-4">
        <div 
          className="cursor-pointer group w-full"
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
            {task.prompt}
          </p>
          <div className="mt-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            双击编辑
          </div>
          
          {/* 错误信息 */}
          {task.status === 'failed' && task.errorMsg && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <span className="font-medium">错误:</span> {task.errorMsg}
            </div>
          )}

          {/* 尝试次数 */}
          {task.attempts > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              尝试次数: {task.attempts}
            </div>
          )}
        </div>
      </div>

      {/* 状态列 */}
      <div className="col-span-2 flex items-center border-r border-gray-200 px-4">
        <span className={`
          inline-flex items-center px-2 py-1 rounded text-xs font-medium
          ${getStatusColor()}
        `}>
          {getStatusIcon()}
          <span className="ml-1">{getStatusText()}</span>
        </span>
      </div>

      {/* 生成图片列 */}
      <div className="col-span-2 flex items-center justify-center border-r border-gray-200 px-4 py-4">
        {task.status === 'succeeded' && task.imageUrl ? (
          <div 
            className="relative w-full h-32 flex items-center justify-center" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedImage(task.imageUrl!);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <img
              key={task.imageUrl}
              src={task.imageUrl}
              alt={`Generated image for task ${task.id}`}
              className="max-w-full max-h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                maxWidth: '100%',
                maxHeight: '128px',
                objectFit: 'cover'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedImage(task.imageUrl!);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              title="点击查看大图"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'w-full h-32 bg-red-50 rounded flex items-center justify-center';
                errorDiv.innerHTML = '<span class="text-xs text-red-400">加载失败</span>';
                target.parentNode?.appendChild(errorDiv);
              }}
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs text-gray-400">暂无</span>
          </div>
        )}
      </div>

      {/* 操作列 */}
      <div className="col-span-1 flex items-center justify-center pl-4">
        <div className="flex items-center space-x-2">
          {/* 选中状态复选框 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(task.id);
            }}
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${task.selected 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            title={task.selected ? '取消选中' : '选中任务'}
          >
            {task.selected && <CheckCircle className="w-3 h-3" />}
          </button>

          {/* 下载按钮 - 只在成功时显示 */}
          {task.status === 'succeeded' && task.imageUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadImage();
              }}
              className="p-1 text-green-600 hover:text-green-700 transition-colors"
              title="下载图片"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* 编辑提示词模态框 */}
      <EditPromptModal
        isOpen={isEditModalOpen}
        prompt={task.prompt}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePrompt}
      />
    </div>
  );
}
