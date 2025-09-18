'use client';

import React from 'react';
import { 
  Play,
  Square,
  Download
} from 'lucide-react';
import { GenTask } from '@/lib/types';

interface GenerationControlPanelProps {
  tasks: GenTask[];
  isRunning: boolean;
  concurrency: number;
  onConcurrencyChange: (value: number) => void;
  onStartGeneration: () => void;
  onStopGeneration: () => void;
  onExportResults: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClear: () => void;
}

export function GenerationControlPanel({
  tasks,
  isRunning,
  concurrency,
  onConcurrencyChange,
  onStartGeneration,
  onStopGeneration,
  onExportResults,
  onSelectAll,
  onDeselectAll,
  onClear
}: GenerationControlPanelProps) {
  const canStart = tasks.some(task => task.selected) && !isRunning;
  const hasResults = tasks.some(task => task.status === 'succeeded');

  // 计算统计信息
  const stats = {
    generating: tasks.filter(t => t.status === 'generating').length,
    succeeded: tasks.filter(t => t.status === 'succeeded').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    idle: tasks.filter(t => t.status === 'idle').length
  };

  return (
    <div className="space-y-3">
      {/* 生成控制区域 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* 左侧：任务统计 */}
        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
          <div className="text-sm text-gray-600">
            共 <span className="font-semibold text-gray-900">{tasks.length}</span> 个任务
          </div>
          <div className="flex items-center flex-wrap gap-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-blue-600">进行中: {stats.generating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-green-600">成功: {stats.succeeded}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span className="text-red-600">失败: {stats.failed}</span>
            </div>
            {stats.idle > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span className="text-gray-500">等待: {stats.idle}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧：操作按钮 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          {/* 并发数设置 */}
          <div className="flex items-center space-x-1">
            <label className="text-xs text-gray-600">并发:</label>
            <select
              value={concurrency}
              onChange={(e) => onConcurrencyChange(Number(e.target.value))}
              disabled={isRunning}
              className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          
          {/* 操作按钮组 */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 全选/反全选按钮 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={onSelectAll}
                disabled={isRunning}
                className="px-2 py-1.5 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="全选所有任务"
              >
                全选
              </button>
              <button
                onClick={onDeselectAll}
                disabled={isRunning}
                className="px-2 py-1.5 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="取消全选"
              >
                反选
              </button>
            </div>

            {/* 生成按钮 */}
            {!isRunning ? (
              <button
                onClick={onStartGeneration}
                disabled={!canStart}
                className={`
                  px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center space-x-1
                  ${canStart 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <Play className="w-3 h-3" />
                <span>开始生成</span>
              </button>
            ) : (
              <button
                onClick={onStopGeneration}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-all shadow-sm hover:shadow-md flex items-center space-x-1"
              >
                <Square className="w-3 h-3" />
                <span>停止生成</span>
              </button>
            )}

            {/* 导出按钮 */}
            {hasResults && (
              <button
                onClick={onExportResults}
                className="px-2 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-all flex items-center space-x-1"
                title="导出结果"
              >
                <Download className="w-3 h-3" />
                <span className="hidden xs:inline">导出</span>
              </button>
            )}

            {/* 清空按钮 */}
            <button
              onClick={onClear}
              className="px-2 py-1.5 bg-gray-500 text-white rounded text-xs font-medium hover:bg-gray-600 transition-all flex items-center space-x-1"
              title="清空所有任务"
            >
              <span>清空</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
