import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateWorkScheduleDto, CreateUserWorkRecordDto } from './dto/schedules.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Графики смен')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // Schedules
  @Post()
  @ApiOperation({ summary: 'Создать запись графика' })
  createSchedule(@Body() dto: CreateWorkScheduleDto, @Request() req: { user: { id: string } }) {
    return this.schedulesService.createSchedule(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Получить мой график' })
  getMySchedules(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req: { user: { id: string } },
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.schedulesService.getUserSchedules(req.user.id, start, end);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить запись графика' })
  removeSchedule(@Param('id') id: string) {
    return this.schedulesService.removeSchedule(id);
  }

  // Work records
  @Post('records')
  @ApiOperation({ summary: 'Создать запись о работе' })
  createRecord(@Body() dto: CreateUserWorkRecordDto, @Request() req: { user: { id: string } }) {
    return this.schedulesService.createRecord(req.user.id, dto);
  }

  @Get('records/me')
  @ApiOperation({ summary: 'Получить мои записи о работе' })
  getMyRecords(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req: { user: { id: string } },
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.schedulesService.getUserRecords(req.user.id, start, end);
  }

  @Get('overtime/summary')
  @ApiOperation({ summary: 'Получить сводку по переработкам за месяц' })
  getOvertimeSummary(
    @Query('month') month: number,
    @Query('year') year: number,
    @Request() req: { user: { id: string } },
  ) {
    return this.schedulesService.getOvertimeSummary(req.user.id, month, year);
  }

  @Delete('records/:id')
  @ApiOperation({ summary: 'Удалить запись о работе' })
  removeRecord(@Param('id') id: string) {
    return this.schedulesService.removeRecord(id);
  }
}
