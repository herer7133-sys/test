import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Task, TaskStatus } from '../types/task';

interface TaskCardProps {
  task: Task;
  onMove: (taskId: string, status: TaskStatus) => void;
}

export function TaskCard({ task, onMove }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div
      ref={drag}
      className={`p-3 bg-white rounded-lg shadow-sm border border-gray-200 mb-2 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
        {task.isOverdue && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
            Просрочено
          </span>
        )}
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex justify-between items-center">
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
          {task.priority === 'low' && 'Низкий'}
          {task.priority === 'medium' && 'Средний'}
          {task.priority === 'high' && 'Высокий'}
          {task.priority === 'critical' && 'Критичный'}
        </span>
        
        {task.dueDate && (
          <span className="text-xs text-gray-500">
            {new Date(task.dueDate).toLocaleDateString('ru-RU')}
          </span>
        )}
      </div>

      {task.checklist && task.checklist.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <span>
              {task.checklist.filter((item) => item.isCompleted).length}/{task.checklist.length}
            </span>
            <div className="ml-2 flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{
                  width: `${(task.checklist.filter((i) => i.isCompleted).length / task.checklist.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onMoveTask: (taskId: string, status: TaskStatus) => void;
}

export function KanbanColumn({ status, title, tasks, onMoveTask }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string; status: TaskStatus }) => {
      if (item.status !== status) {
        onMoveTask(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const statusColors = {
    backlog: 'bg-gray-100 border-gray-300',
    todo: 'bg-blue-50 border-blue-200',
    in_progress: 'bg-yellow-50 border-yellow-200',
    review: 'bg-purple-50 border-purple-200',
    done: 'bg-green-50 border-green-200',
  };

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-[280px] rounded-lg p-3 border-2 ${statusColors[status]} ${
        isOver ? 'border-blue-400 bg-blue-100' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
          {tasks.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onMove={onMoveTask} />
        ))}
      </div>
    </div>
  );
}
