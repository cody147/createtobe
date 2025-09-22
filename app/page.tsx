'use client';

import React, { useState, useCallback } from 'react';
import { UnifiedControlPanel } from '@/components/UnifiedControlPanel';
import { GenerationControlPanel } from '@/components/GenerationControlPanel';
import { TaskList } from '@/components/TaskList';
import { ToastContainer, Toast, ToastType } from '@/components/Toast';
import { GenTask, BatchState, CsvParseResult } from '@/lib/types';
import { runBatchGeneration, stopBatchGeneration } from '@/lib/scheduler';
import { exportAllTasks } from '@/lib/export';

export default function HomePage() {
  // 状态管理
  const [batchState, setBatchState] = useState<BatchState>({
    tasks: [],
    concurrency: 1,
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
      selected: true  // 默认全部选中
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
      concurrency: 1,
      isRunning: false,
      progress: {
        total: 0,
        done: 0,
        success: 0,
        failed: 0
      }
    });
    addToast('info', '已清空所有任务');
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

  // 开始生成
  const handleStartGeneration = useCallback(async () => {
    if (batchState.isRunning) return;

    // 只处理选中的任务
    const selectedTasks = batchState.tasks.filter(task => task.selected);
    if (selectedTasks.length === 0) {
      addToast('warning', '没有选中任务', '请先选择要生成的任务');
      return;
    }

    try {
      addToast('info', '开始批量生成', `正在启动 ${selectedTasks.length} 个选中任务（将重新执行所有选中任务）...`);
      await runBatchGeneration(batchState, updateTask, referenceImages);
      addToast('success', '批量生成完成', '所有选中任务已处理完成，成功任务已自动取消选中');
    } catch (error) {
      addToast('error', '生成失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      // 确保任务完成后重置运行状态
      setBatchState(prev => ({ ...prev, isRunning: false }));
    }
  }, [batchState, updateTask, addToast]);

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
      concurrency: 1,
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
  }, []);

  // 计算是否有任务
  const hasTasks = batchState.tasks.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">批量文生图工具</h1>
              <p className="mt-1 text-sm text-gray-500">
                上传 CSV 文件，批量生成图片，支持并发控制和结果导出
              </p>
            </div>
            <div className="text-sm text-gray-500">
              v1.0.0
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 控制面板 */}
        <div className="mb-6">
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
      </main>

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}