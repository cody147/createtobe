'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Palette, Monitor, Cpu } from 'lucide-react';
import { AppSettings, StyleOption, AspectRatio as AspectRatioType } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

// 预定义的风格选项
const STYLE_OPTIONS: StyleOption[] = [
  {
    name: '系统默认',
    content: '不设置风格，使用系统默认的生成风格'
  },
  {
    name: '超写实风格',
    content: '极致的超写实主义照片风格，画面呈现出顶级数码单反相机（如佳能EOS R5）搭配高质量定焦镜头（如85mm f/1.2）的拍摄效果。明亮、均匀，光影过渡微妙且真实，无明显阴影。绝对真实的全彩照片，无任何色彩滤镜。色彩如同在D65标准光源环境下拍摄，白平衡极其精准，所见即所得。色彩干净通透，类似于现代商业广告摄影风格。严禁任何形式的棕褐色调、复古滤镜或暖黄色偏色。画面高度细腻，细节极其丰富，达到8K分辨率的视觉效果。追求极致的清晰度和纹理表现，所有物体的材质质感都应逼真呈现，无噪点，无失真。'
  },
  {
    name: '动漫风格',
    content: '二次元动漫风格，色彩鲜艳饱满，线条清晰，具有典型的日式动漫美学特征。人物造型精致，表情生动，背景细腻。'
  },
  {
    name: '油画风格',
    content: '经典油画艺术风格，笔触丰富，色彩层次分明，具有厚重的质感和艺术气息。光影效果自然，构图典雅。'
  }
];

// 图片比例选项
const ASPECT_RATIO_OPTIONS: { value: AspectRatioType; label: string; description: string }[] = [
  { value: '3:2', label: '3:2', description: '标准横屏比例' },
  { value: '2:3', label: '2:3', description: '标准竖屏比例' },
  { value: '9:16', label: '9:16', description: '手机竖屏比例' }
];

export function SettingsModal({ isOpen, onClose, settings, onSettingsChange }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);

  // 当外部设置变化时更新本地状态
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* 对话框 */}
      <div className="relative bg-white rounded-2xl shadow-strong max-w-4xl w-full mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-blue-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Settings className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">应用设置</h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* API密钥配置 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">API密钥</h4>
              </div>
              <div className="pl-6">
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={localSettings.apiKey}
                      onChange={(e) => updateSetting('apiKey', e.target.value)}
                      placeholder="请输入您的API密钥"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? '隐藏' : '显示'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    密钥将安全存储在本地，不会上传到服务器
                  </p>
                </div>
              </div>
            </div>

            {/* 并发设置 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">并发设置</h4>
              </div>
              <div className="pl-6">
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-600">并发数量:</label>
                  <select
                    value={localSettings.concurrency}
                    onChange={(e) => updateSetting('concurrency', parseInt(e.target.value))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 5, 10, 20, 30].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 风格选择 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">生成风格</h4>
              </div>
              <div className="pl-6">
                <div className="space-y-4">
                  {STYLE_OPTIONS.map((style, index) => (
                    <label key={index} className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="style"
                        value={index}
                        checked={localSettings.style.name === style.name}
                        onChange={() => updateSetting('style', style)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{style.name}</div>
                        <div className="text-xs text-gray-500 mt-1 leading-relaxed">{style.content}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 图片比例 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">图片比例</h4>
              </div>
              <div className="pl-6">
                <div className="grid grid-cols-3 gap-3">
                  {ASPECT_RATIO_OPTIONS.map((option) => (
                    <label key={option.value} className="flex flex-col items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="aspectRatio"
                        value={option.value}
                        checked={localSettings.aspectRatio === option.value}
                        onChange={(e) => updateSetting('aspectRatio', e.target.value as AspectRatioType)}
                        className="sr-only"
                      />
                      <div className={`w-full h-16 rounded border-2 ${
                        localSettings.aspectRatio === option.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`} style={{
                        aspectRatio: option.value === '3:2' ? '3/2' : option.value === '2:3' ? '2/3' : '9/16'
                      }} />
                      <div className="mt-2 text-center">
                        <div className="text-sm font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 存储管理 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">存储管理</h4>
              </div>
              <div className="pl-6">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    设置会自动保存到浏览器本地存储中，下次打开时会自动加载
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('确定要重置所有设置为默认值吗？')) {
                        const defaultSettings = {
                          concurrency: 10,
                          style: {
                            name: '系统默认',
                            content: '不设置风格，使用系统默认的生成风格'
                          },
                          aspectRatio: '3:2' as AspectRatioType,
                          apiKey: ''
                        };
                        setLocalSettings(defaultSettings);
                      }
                    }}
                    className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                  >
                    重置为默认设置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium transition-all duration-200 rounded-lg text-sm sm:text-base"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 rounded-lg shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
