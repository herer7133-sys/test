import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, TaskStatus } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Создать задачу' })
  async create(@Body() dto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список задач с фильтрами' })
  async findAll(
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('sensorId') sensorId?: string,
    @Query('priority') priority?: string,
  ) {
    return this.tasksService.findAll({ status, assigneeId, sensorId, priority });
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Получить данные для Kanban доски' })
  async getKanban() {
    return this.tasksService.getKanbanData();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить задачу по ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Переместить задачу (Kanban)' })
  async move(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveTaskDto, @Request() req) {
    return this.tasksService.move(id, dto.status, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить задачу' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto, @Request() req) {
    return this.tasksService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить задачу' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.tasksService.delete(id, req.user.id);
  }
}
