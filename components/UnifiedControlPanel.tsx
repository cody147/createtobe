'use client';

import React, { useCallback, useState } from 'react';
import { 
  Upload, 
  AlertCircle, 
  Download, 
  RefreshCw
} from 'lucide-react';
import { parseCsvFile, validateCsvFile } from '@/lib/csv';
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
  onReupload: () => void;
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
  onDeselectAll,
  onReupload
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
    console.log('开始下载示例文件...');
    // 直接下载静态文件
    const link = document.createElement('a');
    link.href = '/sample.csv';
    link.download = 'sample.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('下载链接已触发');
  }, []);

  const hasTasks = tasks.length > 0;

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
            style={{ zIndex: 1 }}
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
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDownloadSample();
              }}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors relative"
              style={{ zIndex: 10 }}
            >
              <Download className="w-3 h-3 mr-1" />
              下载示例文件
            </button>
          </div>
        </div>
      ) : null}

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