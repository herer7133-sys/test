export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdById: string;
  sensorId?: string;
  dueDate?: string;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export interface KanbanData {
  [TaskStatus.BACKLOG]: Task[];
  [TaskStatus.TODO]: Task[];
  [TaskStatus.IN_PROGRESS]: Task[];
  [TaskStatus.REVIEW]: Task[];
  [TaskStatus.DONE]: Task[];
}
