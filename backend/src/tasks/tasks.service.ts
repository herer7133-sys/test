import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskStatus } from './dto/task.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepo.create({
      ...dto,
      createdById: userId,
      checklist: dto.checklist?.map((item) => ({
        id: crypto.randomUUID(),
        text: item.text,
        isCompleted: item.isCompleted || false,
      })) || [],
    });
    return this.taskRepo.save(task);
  }

  async findAll(filters: {
    status?: TaskStatus;
    assigneeId?: string;
    sensorId?: string;
    priority?: string;
  }): Promise<Task[]> {
    const query = this.taskRepo.createQueryBuilder('task');
    
    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters.assigneeId) {
      query.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
    }
    if (filters.sensorId) {
      query.andWhere('task.sensorId = :sensorId', { sensorId: filters.sensorId });
    }
    if (filters.priority) {
      query.andWhere('task.priority = :priority', { priority: filters.priority });
    }

    query.leftJoinAndSelect('task.assignee', 'assignee');
    query.leftJoinAndSelect('task.sensor', 'sensor');
    query.orderBy('task.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignee', 'sensor', 'createdBy'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id);
    
    // Check permissions (simplified: only assignee or creator can update)
    if (task.assigneeId !== userId && task.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    if (dto.checklist) {
      // Merge existing checklist with updates
      task.checklist = dto.checklist.map((item) => ({
        id: item.id || crypto.randomUUID(),
        text: item.text,
        isCompleted: item.isCompleted,
        completedAt: item.isCompleted && !task.checklist.find(c => c.id === item.id)?.isCompleted 
          ? new Date() 
          : task.checklist.find(c => c.id === item.id)?.completedAt,
      }));
    }

    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async move(id: string, status: TaskStatus, userId: string): Promise<Task> {
    return this.update(id, { status }, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id);
    if (task.createdById !== userId) {
      throw new ForbiddenException('You can only delete tasks you created');
    }
    await this.taskRepo.remove(task);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkOverdueTasks(): Promise<void> {
    const today = new Date();
    const overdueTasks = await this.taskRepo
      .createQueryBuilder('task')
      .where('task.dueDate < :today', { today })
      .andWhere('task.status != :done', { done: TaskStatus.DONE })
      .andWhere('task.isOverdue = false')
      .getMany();

    for (const task of overdueTasks) {
      task.isOverdue = true;
      // Here you could send notifications
    }

    if (overdueTasks.length > 0) {
      await this.taskRepo.save(overdueTasks);
      console.log(`Marked ${overdueTasks.length} tasks as overdue`);
    }
  }

  async getKanbanData(): Promise<Record<TaskStatus, Task[]>> {
    const tasks = await this.findAll({});
    const kanban: Record<TaskStatus, Task[]> = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.REVIEW]: [],
      [TaskStatus.DONE]: [],
    };

    tasks.forEach((task) => {
      kanban[task.status].push(task);
    });

    return kanban;
  }
}
