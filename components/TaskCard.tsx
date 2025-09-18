'use client';

import React, { useState } from 'react';
import { 
  Eye, 
  Download, 
  Edit3, 
  Save, 
  X,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { GenTask } from '@/lib/types';
import { ImageModal } from './ImageModal';

interface TaskCardProps {
  task: GenTask;
  onRetryTask: (taskId: number) => void;
  onUpdateTask: (taskId: number, updates: Partial<GenTask>) => void;
  onToggleSelection: (taskId: number) => void;
}

export function TaskCard({ task, onRetryTask, onUpdateTask, onToggleSelection }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(task.prompt);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleSaveEdit = () => {
    if (editingPrompt.trim()) {
      onUpdateTask(task.id, { prompt: editingPrompt.trim() });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPrompt(task.prompt);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
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
        rounded-lg border p-3 transition-all cursor-pointer
        ${task.selected 
          ? 'bg-blue-50 border-blue-300 shadow-sm' 
          : 'bg-white border-gray-200 hover:shadow-sm hover:border-gray-300'
        }
      `}
      onClick={() => onToggleSelection(task.id)}
    >
      <div className="flex items-start space-x-3">
        {/* 左侧：序号和状态 */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">#{task.id}</span>
          </div>
          <div className="mt-1 flex justify-center">
            <span className={`
              inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
              ${getStatusColor()}
            `}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </span>
          </div>
          {/* 选中状态复选框 */}
          <div className="mt-1 flex justify-center">
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
          </div>
        </div>

        {/* 中间：提示词内容 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editingPrompt}
                onChange={(e) => setEditingPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="输入提示词..."
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                >
                  <Save className="w-3 h-3 mr-1" />
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3 mr-1" />
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="group cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}>
              <p className="text-sm text-gray-900 line-clamp-2 leading-relaxed">
                {task.prompt}
              </p>
              <button className="mt-1 opacity-0 group-hover:opacity-100 inline-flex items-center text-xs text-blue-600 hover:text-blue-700 transition-all">
                <Edit3 className="w-3 h-3 mr-1" />
                编辑
              </button>
            </div>
          )}

          {/* 错误信息 */}
          {task.status === 'failed' && task.errorMsg && (
            <div className="mt-1 p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
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

        {/* 右侧：图片和操作 */}
        <div className="flex-shrink-0 flex flex-col items-center space-y-1" onClick={(e) => e.stopPropagation()}>
          {/* 图片预览 */}
          {task.status === 'succeeded' && task.imageUrl ? (
            <div className="relative">
              <img
                src={task.imageUrl}
                alt={`Generated image for task ${task.id}`}
                className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImage(task.imageUrl!)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded transition-all flex items-center justify-center">
                <Eye className="w-3 h-3 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs text-gray-400">暂无</span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center space-x-1">
            {task.status === 'failed' && (
              <button
                onClick={() => onRetryTask(task.id)}
                className="p-1 text-orange-600 hover:text-orange-700 transition-colors"
                title="重试"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            {task.status === 'succeeded' && task.imageUrl && (
              <>
                <button
                  onClick={() => setSelectedImage(task.imageUrl!)}
                  className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                  title="查看大图"
                >
                  <Eye className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDownloadImage}
                  className="p-1 text-green-600 hover:text-green-700 transition-colors"
                  title="下载图片"
                >
                  <Download className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
