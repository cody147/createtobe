'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface EditPromptModalProps {
  isOpen: boolean;
  prompt: string;
  onClose: () => void;
  onSave: (newPrompt: string) => void;
}

export function EditPromptModal({ isOpen, prompt, onClose, onSave }: EditPromptModalProps) {
  const [editingPrompt, setEditingPrompt] = useState(prompt);

  // 当弹窗打开时，重置编辑内容
  useEffect(() => {
    if (isOpen) {
      setEditingPrompt(prompt);
    }
  }, [isOpen, prompt]);

  // 处理 ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (editingPrompt.trim()) {
      onSave(editingPrompt.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">编辑提示词</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-4">
          <textarea
            value={editingPrompt}
            onChange={(e) => setEditingPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            className="w-full h-64 p-3 text-sm border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入提示词..."
            autoFocus
          />
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={!editingPrompt.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>保存</span>
          </button>
        </div>

        {/* 快捷键提示 */}
        <div className="px-4 pb-2 text-xs text-gray-500">
          <span>快捷键：Ctrl+Enter 保存，Esc 取消</span>
        </div>
      </div>
    </div>
  );
}
