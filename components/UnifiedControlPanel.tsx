'use client';

import React, { useCallback, useState } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { parseCsvFile, validateCsvFile, generateSampleCsv } from '@/lib/csv';
import { CsvParseResult, GenTask } from '@/lib/types';

interface UnifiedControlPanelProps {
  tasks: GenTask[];
  isRunning: boolean;
  concurrency: number;
  onConcurrencyChange: (value: number) => void;
  onCsvParsed: (result: CsvParseResult) => void;
  onClear: () => void;
  onStartGeneration: () => void;
  onStopGeneration: () => void;
  onExportResults: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function UnifiedControlPanel({
  tasks,
  isRunning,
  concurrency,
  onConcurrencyChange,
  onCsvParsed,
  onClear,
  onStartGeneration,
  onStopGeneration,
  onExportResults,
  onSelectAll,
  onDeselectAll
}: UnifiedControlPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (isRunning) return;

    setError(null);
    setIsParsing(true);

    try {
      if (!validateCsvFile(file)) {
        throw new Error('请选择有效的 CSV 文件');
      }

      const result = await parseCsvFile(file);
      onCsvParsed(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件解析失败';
      setError(errorMessage);
    } finally {
      setIsParsing(false);
    }
  }, [onCsvParsed, isRunning]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isRunning) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect, isRunning]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDownloadSample = useCallback(() => {
    const sampleCsv = generateSampleCsv();
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const hasTasks = tasks.length > 0;
  const canStart = tasks.some(task => task.selected) && !isRunning;
  const hasFailedTasks = tasks.some(task => task.status === 'failed');
  const hasResults = tasks.some(task => task.status === 'succeeded');

  // 计算统计信息
  const stats = {
    generating: tasks.filter(t => t.status === 'generating').length,
    succeeded: tasks.filter(t => t.status === 'succeeded').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    idle: tasks.filter(t => t.status === 'idle').length
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* 文件上传区域 */}
      {!hasTasks ? (
        // 无任务时显示紧凑上传界面
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isRunning ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept=".csv,text/csv,application/csv"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isRunning}
          />
          
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-gray-100 rounded-full">
              {isParsing ? (
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-gray-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {isParsing ? '正在解析 CSV 文件...' : '上传 CSV 文件'}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                拖拽文件到此处，或点击选择文件
              </p>
              <p className="text-xs text-gray-500">
                支持格式：CSV（UTF-8 编码），需要包含序号和提示词两列
              </p>
            </div>
            
            <button
              onClick={handleDownloadSample}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Download className="w-3 h-3 mr-1" />
              下载示例文件
            </button>
          </div>
        </div>
      ) : (
        // 有任务时显示紧凑状态和控制
        <div className="space-y-3">
          {/* 文件状态 */}
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-sm font-medium text-gray-900">已加载 {tasks.length} 个任务</div>
                <div className="text-xs text-gray-500">CSV 文件解析成功</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div
                className={`
                  relative border border-dashed border-gray-300 rounded px-2 py-1 text-center transition-all duration-200 cursor-pointer hover:border-gray-400
                  ${isDragOver ? 'border-blue-500 bg-blue-50' : ''}
                  ${isRunning ? 'opacity-50 pointer-events-none' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept=".csv,text/csv,application/csv"
                  onChange={handleFileInputChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isRunning}
                />
                
                <div className="flex items-center space-x-1">
                  {isParsing ? (
                    <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3 text-gray-500" />
                  )}
                  <span className="text-xs text-gray-600">
                    {isParsing ? '解析中...' : '重新上传'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={onClear}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                清空
              </button>
            </div>
          </div>

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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-medium text-red-800">解析失败</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
