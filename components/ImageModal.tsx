'use client';

import React, { useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
  };

  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 z-10 p-2 text-white hover:text-gray-300 transition-colors"
          aria-label="关闭预览"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 图片容器 */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* 操作栏 */}
          <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-lg transition-all"
              title="下载图片"
            >
              <Download className="w-5 h-5 text-gray-700" />
            </button>
            
            <button
              onClick={handleOpenInNewTab}
              className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-lg transition-all"
              title="在新标签页中打开"
            >
              <ExternalLink className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* 图片 */}
          <div className="flex items-center justify-center p-4 relative">
            <img
              key={imageUrl} // 使用key强制重新渲染
              src={imageUrl}
              alt="Generated image preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                // 创建错误提示
                const errorDiv = document.createElement('div');
                errorDiv.className = 'flex items-center justify-center h-64 w-full';
                errorDiv.innerHTML = `
                  <div class="flex flex-col items-center space-y-3">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <span class="text-sm text-red-500">图片加载失败</span>
                  </div>
                `;
                target.parentNode?.appendChild(errorDiv);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}




