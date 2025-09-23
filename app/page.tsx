'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { UnifiedControlPanel } from '@/components/UnifiedControlPanel';
import { GenerationControlPanel } from '@/components/GenerationControlPanel';
import { TaskList } from '@/components/TaskList';
import { ToastContainer, Toast, ToastType } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SettingsModal } from '@/components/SettingsModal';
import { GenTask, BatchState, CsvParseResult, AppSettings } from '@/lib/types';
import { runBatchGeneration, stopBatchGeneration } from '@/lib/scheduler';
import { exportAllTasks } from '@/lib/export';

export default function HomePage() {
  // 状态管理
  const [batchState, setBatchState] = useState<BatchState>({
    tasks: [],
    concurrency: 10,
    isRunning: false,
    progress: {
      total: 0,
      done: 0,
      success: 0,
      failed: 0
    }
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  
  // 从本地存储加载设置
  const loadSettingsFromStorage = (): AppSettings => {
    if (typeof window === 'undefined') {
      return {
        concurrency: 10,
        style: {
          name: '系统默认',
          content: '不设置风格，使用系统默认的生成风格'
        },
        aspectRatio: '3:2',
        apiKey: ''
      };
    }

    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // 验证设置格式，确保所有必需字段都存在
        if (parsed.concurrency && parsed.style && parsed.aspectRatio !== undefined) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }

    // 返回默认设置
    return {
      concurrency: 10,
      style: {
        name: '系统默认',
        content: '不设置风格，使用系统默认的生成风格'
      },
      aspectRatio: '3:2',
      apiKey: ''
    };
  };

  // 应用设置状态
  const [appSettings, setAppSettings] = useState<AppSettings>(loadSettingsFromStorage);
  
  // 设置模态框状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 初始化时同步并发设置
  useEffect(() => {
    setBatchState(prev => ({ ...prev, concurrency: appSettings.concurrency }));
  }, [appSettings.concurrency]);
  
  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // 添加 Toast
  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, type, title, message, duration };
    setToasts(prev => [...prev, newToast]);
  }, []);

  // 移除 Toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 关闭确认对话框
  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 打开设置模态框
  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  // 关闭设置模态框
  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // 保存设置到本地存储
  const saveSettingsToStorage = useCallback((settings: AppSettings) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        console.log('Settings saved to localStorage:', settings);
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error);
        addToast('error', '保存失败', '无法保存设置到本地存储');
      }
    }
  }, [addToast]);

  // 处理设置变更
  const handleSettingsChange = useCallback((newSettings: AppSettings) => {
    setAppSettings(newSettings);
    // 保存到本地存储
    saveSettingsToStorage(newSettings);
    // 同步更新批量状态中的并发数
    setBatchState(prev => ({ ...prev, concurrency: newSettings.concurrency }));
    addToast('success', '设置已保存', '您的设置已成功保存到本地存储');
  }, [addToast, saveSettingsToStorage]);

  // 处理参考图变更
  const handleReferenceImagesChange = useCallback((images: File[]) => {
    console.log('参考图变更:', images);
    setReferenceImages(images);
  }, []);

  // 处理 CSV 解析结果
  const handleCsvParsed = useCallback((result: CsvParseResult) => {
    if (result.validRows.length === 0) {
      addToast('error', 'CSV 解析失败', '没有找到有效的任务行');
      return;
    }

    const tasks: GenTask[] = result.validRows.map(row => ({
      ...row,
      status: 'idle' as const,
      attempts: 0,
      selected: false  // 默认不选中，用户需要手动选择
    }));

    setBatchState(prev => ({
      ...prev,
      tasks,
      progress: {
        total: tasks.length,
        done: 0,
        success: 0,
        failed: 0
      }
    }));

    addToast('success', 'CSV 解析成功', `成功解析 ${result.validRows.length} 个任务`);
    
    if (result.invalidRows > 0) {
      addToast('warning', '部分行解析失败', `有 ${result.invalidRows} 行无效，已跳过`);
    }
  }, [addToast]);

  // 清空任务
  const handleClear = useCallback(() => {
    setBatchState({
      tasks: [],
      concurrency: 10,
      isRunning: false,
      progress: {
        total: 0,
        done: 0,
        success: 0,
        failed: 0
      }
    });
    // 同时清空参考图
    setReferenceImages([]);
    addToast('info', '已清空所有任务和参考图');
  }, [addToast]);

  // 全选/反全选
  const handleSelectAll = useCallback(() => {
    setBatchState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => ({ ...task, selected: true }))
    }));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setBatchState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => ({ ...task, selected: false }))
    }));
  }, []);

  // 切换单个任务选中状态
  const handleToggleTaskSelection = useCallback((taskId: number) => {
    setBatchState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId ? { ...task, selected: !task.selected } : task
      )
    }));
  }, []);

  // 更新任务状态
  const updateTask = useCallback((updatedTask: GenTask) => {
    setBatchState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    }));
  }, []);

  // 更新任务属性
  const handleUpdateTask = useCallback((taskId: number, updates: Partial<GenTask>) => {
    setBatchState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    }));
  }, []);

  // 开始生成 - 显示确认对话框
  const handleStartGeneration = useCallback(() => {
    if (batchState.isRunning) return;

    // 只处理选中的任务
    const selectedTasks = batchState.tasks.filter(task => task.selected);
    if (selectedTasks.length === 0) {
      addToast('warning', '没有选中任务', '请先选择要生成的任务');
      return;
    }

    // 计算统计信息
    const stats = {
      total: selectedTasks.length,
      idle: selectedTasks.filter(t => t.status === 'idle').length,
      succeeded: selectedTasks.filter(t => t.status === 'succeeded').length,
      failed: selectedTasks.filter(t => t.status === 'failed').length,
      stopped: selectedTasks.filter(t => t.status === 'stopped').length
    };

    // 构建友好的提示信息
    let message = `🎨 即将开始批量生成 ${stats.total} 个任务\n\n`;
    
    // 显示用户设置信息
    message += `⚙️ 当前设置：\n`;
    message += `• 并发数量：${appSettings.concurrency}\n`;
    message += `• 生成风格：${appSettings.style.name}\n`;
    message += `• 图片比例：${appSettings.aspectRatio}\n`;
    message += `• API密钥：${appSettings.apiKey ? '已配置' : '未配置'}\n\n`;
    
    // 任务状态详情 - 每个状态单独一行
    if (stats.succeeded > 0) {
      message += `🔄 ${stats.succeeded} 个已成功任务（将重新生成）\n`;
    }
    if (stats.failed > 0) {
      message += `🔁 ${stats.failed} 个失败任务（将重新尝试）\n`;
    }
    if (stats.stopped > 0) {
      message += `▶️ ${stats.stopped} 个已停止任务（将重新开始）\n`;
    }
    if (stats.idle > 0) {
      message += `✨ ${stats.idle} 个新任务（首次生成）\n`;
    }
    
    // 添加空行分隔
    message += `\n`;
    
    // 操作提示
    message += `💡 温馨提示：\n`;
    message += `• 生成过程中可随时点击"停止生成"按钮中断\n`;
    message += `• 生成完成后，成功任务会自动取消选中状态\n`;
    message += `• 建议在网络稳定的环境下进行批量生成`;

    // 显示确认对话框
    setConfirmDialog({
      isOpen: true,
      title: '🚀 开始批量生成',
      message,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        executeGeneration();
      }
    });
  }, [batchState, appSettings, addToast]);

  // 实际执行生成
  const executeGeneration = useCallback(async () => {
    const selectedTasks = batchState.tasks.filter(task => task.selected);
    
    // 检查API密钥
    if (!appSettings.apiKey || appSettings.apiKey.trim() === '') {
      addToast('error', 'API密钥未配置', '请先在设置中配置API密钥');
      return;
    }
    
    try {
      addToast('info', '开始批量生成', `正在启动 ${selectedTasks.length} 个选中任务...`);
      await runBatchGeneration(batchState, updateTask, referenceImages, {
        apiKey: appSettings.apiKey,
        style: appSettings.style,
        aspectRatio: appSettings.aspectRatio
      });
      addToast('success', '批量生成完成', '所有选中任务已处理完成，成功任务已自动取消选中');
    } catch (error) {
      addToast('error', '生成失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      // 确保任务完成后重置运行状态
      setBatchState(prev => ({ ...prev, isRunning: false }));
    }
  }, [batchState, updateTask, referenceImages, appSettings, addToast]);

  // 停止生成
  const handleStopGeneration = useCallback(() => {
    stopBatchGeneration(batchState);
    addToast('warning', '已停止生成', '正在停止所有任务...');
  }, [batchState, addToast]);

  // 重新上传
  const handleReupload = useCallback(() => {
    // 清空当前任务
    setBatchState({
      tasks: [],
      concurrency: 10,
      isRunning: false,
      progress: { total: 0, done: 0, success: 0, failed: 0 }
    });
    addToast('info', '已清空任务', '可以重新上传CSV文件');
  }, [addToast]);




  // 导出结果
  const handleExportResults = useCallback(() => {
    try {
      exportAllTasks(batchState.tasks);
      addToast('success', '导出成功', '结果已保存到本地文件');
    } catch (error) {
      addToast('error', '导出失败', error instanceof Error ? error.message : '未知错误');
    }
  }, [batchState.tasks, addToast]);

  // 显示统计信息
  const handleShowStats = useCallback(() => {
    const stats = batchState.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const message = Object.entries(stats)
      .map(([status, count]) => `${status}: ${count}`)
      .join(', ');

    addToast('info', '任务统计', message, 10000);
  }, [batchState.tasks, addToast]);

  // 更新并发数
  const handleConcurrencyChange = useCallback((concurrency: number) => {
    setBatchState(prev => ({ ...prev, concurrency }));
    setAppSettings(prev => ({ ...prev, concurrency }));
  }, []);

  // 计算是否有任务
  const hasTasks = batchState.tasks.length > 0;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* 头部 */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">批量文生图工具</h1>
            </div>
            <button
              onClick={handleOpenSettings}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="应用设置"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">设置</span>
            </button>
          </div>
        </div>
      </header>

      {/* 固定的控制面板 */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {!hasTasks ? (
            <UnifiedControlPanel
              tasks={batchState.tasks}
              isRunning={batchState.isRunning}
              concurrency={batchState.concurrency}
              onConcurrencyChange={handleConcurrencyChange}
              onCsvParsed={handleCsvParsed}
              onClear={handleClear}
              onStartGeneration={handleStartGeneration}
              onStopGeneration={handleStopGeneration}
              onExportResults={handleExportResults}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onReupload={handleReupload}
            />
          ) : (
            <GenerationControlPanel
              tasks={batchState.tasks}
              isRunning={batchState.isRunning}
              concurrency={batchState.concurrency}
              referenceImages={referenceImages}
              onConcurrencyChange={handleConcurrencyChange}
              onStartGeneration={handleStartGeneration}
              onStopGeneration={handleStopGeneration}
              onExportResults={handleExportResults}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onClear={handleClear}
              onReferenceImagesChange={handleReferenceImagesChange}
            />
          )}
        </div>
      </div>

      {/* 固定的表头 */}
      {hasTasks && (
        <div className="bg-white border-b flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 px-4 py-3">
                <div className="col-span-1 text-xs font-medium text-gray-700 border-r border-gray-300 pr-4">编号</div>
                <div className="col-span-6 text-xs font-medium text-gray-700 border-r border-gray-300 px-4">提示词</div>
                <div className="col-span-2 text-xs font-medium text-gray-700 border-r border-gray-300 px-4">状态</div>
                <div className="col-span-2 text-xs font-medium text-gray-700 border-r border-gray-300 px-4">生成图片</div>
                <div className="col-span-1 text-xs font-medium text-gray-700 pl-4">操作</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 可滚动的主要内容区域 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* 任务列表 */}
          {hasTasks && (
            <TaskList
              tasks={batchState.tasks}
              onUpdateTask={handleUpdateTask}
              onToggleSelection={handleToggleTaskSelection}
            />
          )}

          {/* 空状态 */}
          {!hasTasks && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">还没有任务</h3>
              <p className="text-gray-500">请上传 CSV 文件开始批量生成图片</p>
            </div>
          )}
        </div>
      </main>

      {/* 设置模态框 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        settings={appSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="🚀 开始生成"
        cancelText="取消"
        onConfirm={confirmDialog.onConfirm}
        onCancel={handleCloseConfirmDialog}
        type="warning"
      />

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}