import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { TaskStatus } from '../types/task';

export function useTasks() {
  const queryClient = useQueryClient();

  // Create task
  const createTask = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Update task
  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Move task (Kanban)
  const moveTask = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      api.post(`/tasks/${id}/move`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });

  // Delete task
  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });

  return {
    createTask,
    updateTask,
    moveTask,
    deleteTask,
  };
}
