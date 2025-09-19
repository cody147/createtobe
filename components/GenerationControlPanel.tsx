'use client';

import React, { useRef, useState } from 'react';
import { 
  Play,
  Square,
  Download,
  Image,
  X,
  Upload
} from 'lucide-react';
import { GenTask } from '@/lib/types';
import { ImageModal } from './ImageModal';

interface GenerationControlPanelProps {
  tasks: GenTask[];
  isRunning: boolean;
  concurrency: number;
  referenceImages?: File[];
  onConcurrencyChange: (value: number) => void;
  onStartGeneration: () => void;
  onStopGeneration: () => void;
  onExportResults: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClear: () => void;
  onReferenceImagesChange: (images: File[]) => void;
}

export function GenerationControlPanel({
  tasks,
  isRunning,
  concurrency,
  referenceImages,
  onConcurrencyChange,
  onStartGeneration,
  onStopGeneration,
  onExportResults,
  onSelectAll,
  onDeselectAll,
  onClear,
  onReferenceImagesChange
}: GenerationControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalImage, setModalImage] = useState<{url: string, name: string, path: string} | null>(null);
  const canStart = tasks.some(task => task.selected) && !isRunning;
  const hasResults = tasks.some(task => task.status === 'succeeded');

  // 调试信息
  console.log('GenerationControlPanel props:', {
    referenceImages,
    onReferenceImagesChange: typeof onReferenceImagesChange,
    referenceImagesLength: (referenceImages || []).length
  });

  // 计算统计信息
  const stats = {
    generating: tasks.filter(t => t.status === 'generating').length,
    succeeded: tasks.filter(t => t.status === 'succeeded').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    idle: tasks.filter(t => t.status === 'idle').length
  };

  // 处理参考图选择
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('选择的文件:', files); // 调试日志
    if (files.length > 0) {
      const newImages = [...(referenceImages || []), ...files];
      console.log('新的图片数组:', newImages); // 调试日志
      if (typeof onReferenceImagesChange === 'function') {
        onReferenceImagesChange(newImages);
      } else {
        console.error('onReferenceImagesChange is not a function:', onReferenceImagesChange);
      }
    }
    // 清空input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 删除参考图
  const handleRemoveImage = (index: number) => {
    const newImages = (referenceImages || []).filter((_, i) => i !== index);
    if (typeof onReferenceImagesChange === 'function') {
      onReferenceImagesChange(newImages);
    } else {
      console.error('onReferenceImagesChange is not a function:', onReferenceImagesChange);
    }
  };

  // 打开文件选择器
  const handleSelectImages = () => {
    fileInputRef.current?.click();
  };

  // 打开参考图模态窗口
  const handleOpenImageModal = (image: File) => {
    const url = URL.createObjectURL(image);
    setModalImage({
      url,
      name: image.name,
      path: image.webkitRelativePath || image.name
    });
  };

  // 关闭模态窗口
  const handleCloseModal = () => {
    if (modalImage) {
      URL.revokeObjectURL(modalImage.url);
    }
    setModalImage(null);
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

        {/* 右侧：操作按钮和参考图 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          {/* 参考图功能 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">参考图:</span>


            {/* 参考图预览 - 显示在文案后面 */}
            {(referenceImages || []).length > 0 && (
              <div className="flex items-center gap-2">
                {(referenceImages || []).map((image, index) => (
                  <div key={index} className="relative group flex flex-col items-center">
                    <div 
                      className="w-12 h-12 rounded overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => handleOpenImageModal(image)}
                      title="点击查看大图"
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`参考图 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveImage(index)}
                      disabled={isRunning}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      title="删除参考图"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    {/* 图片名字显示在图片下面 - 去掉后缀 */}
                    <div 
                      className="text-xs text-gray-500 mt-1 max-w-12 truncate cursor-pointer hover:text-gray-700" 
                      title={image.name}
                      onClick={() => handleOpenImageModal(image)}
                    >
                      {image.name.replace(/\.[^/.]+$/, '')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSelectImages}
              disabled={isRunning}
              className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              title="添加参考图"
            >
              <Upload className="w-3 h-3" />
              <span>选择图片</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

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

      {/* 参考图模态窗口 */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
            {/* 关闭按钮 */}
            <button
              onClick={handleCloseModal}
              className="absolute -top-12 right-0 z-10 p-2 text-white hover:text-gray-300 transition-colors"
              aria-label="关闭预览"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 图片容器 */}
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* 图片信息 */}
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">图片名称: {modalImage.name}</div>
                  <div className="text-xs text-gray-500 mt-1">文件路径: {modalImage.path}</div>
                </div>
              </div>

              {/* 图片 */}
              <div className="flex items-center justify-center p-4">
                <img
                  src={modalImage.url}
                  alt="参考图预览"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'flex items-center justify-center h-64 text-gray-500';
                    errorDiv.textContent = '图片加载失败';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
