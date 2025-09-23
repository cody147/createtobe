'use client';

import React from 'react';
import { GenTask } from '@/lib/types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: GenTask[];
  onUpdateTask: (taskId: number, updates: Partial<GenTask>) => void;
  onToggleSelection: (taskId: number) => void;
  originalCsvFilename?: string;
}

export function TaskList({ tasks, onUpdateTask, onToggleSelection, originalCsvFilename }: TaskListProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {tasks.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateTask={onUpdateTask}
              onToggleSelection={onToggleSelection}
              originalCsvFilename={originalCsvFilename}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <div className="w-10 h-10 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xl">📝</span>
            </div>
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">还没有任务</h3>
          <p className="text-sm text-gray-500">请上传 CSV 文件开始批量生成图片</p>
        </div>
      )}
    </div>
  );
}
