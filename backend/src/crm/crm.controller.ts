import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateCounterpartyDto, UpdateCounterpartyDto, CreateActivityDto, CreateProjectDto, UpdateProjectDto, ProjectStatus } from './dto/crm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // Counterparties
  @Post('counterparties')
  @ApiOperation({ summary: 'Создать контрагента' })
  async createCounterparty(@Body() dto: CreateCounterpartyDto) {
    return this.crmService.createCounterparty(dto);
  }

  @Get('counterparties')
  @ApiOperation({ summary: 'Получить список контрагентов' })
  async findAllCounterparties(@Query('partyId') partyId?: string) {
    return this.crmService.findAllCounterparties(partyId);
  }

  @Get('counterparties/:id')
  @ApiOperation({ summary: 'Получить контрагента по ID' })
  async findOneCounterparty(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.findOneCounterparty(id);
  }

  @Put('counterparties/:id')
  @ApiOperation({ summary: 'Обновить контрагента' })
  async updateCounterparty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCounterpartyDto,
  ) {
    return this.crmService.updateCounterparty(id, dto);
  }

  @Delete('counterparties/:id')
  @ApiOperation({ summary: 'Удалить контрагента' })
  async deleteCounterparty(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.deleteCounterparty(id);
  }

  // Activities
  @Post('activities')
  @ApiOperation({ summary: 'Создать активность' })
  async createActivity(@Body() dto: CreateActivityDto, @Request() req) {
    return this.crmService.createActivity(dto, req.user.id);
  }

  @Get('counterparties/:id/activities')
  @ApiOperation({ summary: 'Получить активности контрагента' })
  async findActivities(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.findActivitiesByCounterparty(id);
  }

  @Post('activities/:id/complete')
  @ApiOperation({ summary: 'Отметить активность как завершенную' })
  async completeActivity(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.completeActivity(id);
  }

  // Projects
  @Post('projects')
  @ApiOperation({ summary: 'Создать проект' })
  async createProject(@Body() dto: CreateProjectDto, @Request() req) {
    return this.crmService.createProject(dto, req.user.id);
  }

  @Get('projects')
  @ApiOperation({ summary: 'Получить список проектов' })
  async findAllProjects(
    @Query('partyId') partyId?: string,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.crmService.findAllProjects(partyId, status);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Получить проект по ID' })
  async findOneProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.findOneProject(id);
  }

  @Put('projects/:id')
  @ApiOperation({ summary: 'Обновить проект' })
  async updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.crmService.updateProject(id, dto);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Удалить проект' })
  async deleteProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.deleteProject(id);
  }

  // Dashboard
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Получить статистику CRM' })
  async getDashboardStats(@Query('partyId') partyId?: string) {
    return this.crmService.getDashboardStats(partyId);
  }
}
