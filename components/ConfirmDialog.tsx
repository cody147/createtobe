'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          iconBg: 'bg-red-50',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md',
          border: 'border-red-200',
          headerBg: 'bg-red-50'
        };
      case 'info':
        return {
          icon: 'text-blue-500',
          iconBg: 'bg-blue-50',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
          border: 'border-blue-200',
          headerBg: 'bg-blue-50'
        };
      default:
        return {
          icon: 'text-orange-500',
          iconBg: 'bg-orange-50',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow-md',
          border: 'border-orange-200',
          headerBg: 'bg-orange-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* 对话框 */}
      <div className={`
        relative bg-white rounded-2xl shadow-strong max-w-md w-full mx-4
        border ${styles.border}
        animate-in fade-in-0 zoom-in-95 duration-200
      `}>
        {/* 头部 */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-100 ${styles.headerBg} rounded-t-2xl`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${styles.iconBg}`}>
              <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium transition-all duration-200 rounded-lg"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`
              px-6 py-2.5 rounded-lg font-medium transition-all duration-200
              ${styles.confirmButton}
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
