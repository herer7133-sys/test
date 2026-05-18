import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { CreateTrainingMaterialDto, UpdateTrainingMaterialDto, UpdateUserProgressDto } from './dto/training.dto';
import { MaterialStatus } from './entities/training-material.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('Обучение')
@Controller('training/materials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post()
  @ApiOperation({ summary: 'Создать учебный материал' })
  create(@Body() dto: CreateTrainingMaterialDto, @Request() req: { user: User }) {
    return this.trainingService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список материалов' })
  findAll(@Query('status') status?: MaterialStatus) {
    return this.trainingService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить материал по ID' })
  findOne(@Param('id') id: string) {
    return this.trainingService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить материал' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingMaterialDto,
    @Request() req: { user: User },
  ) {
    return this.trainingService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить материал' })
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    return this.trainingService.remove(id, req.user);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Получить прогресс пользователя по материалу' })
  getProgress(@Param('id') id: string, @Request() req: { user: User }) {
    return this.trainingService.getProgress(req.user.id, id);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Обновить прогресс пользователя' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateUserProgressDto,
    @Request() req: { user: User },
  ) {
    return this.trainingService.updateProgress(req.user.id, id, dto);
  }

  @Get('user/progress')
  @ApiOperation({ summary: 'Получить весь прогресс пользователя' })
  getUserProgress(@Request() req: { user: User }) {
    return this.trainingService.getUserProgress(req.user.id);
  }
}
