import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingMaterial, MaterialStatus } from './entities/training-material.entity';
import { UserProgress } from './entities/user-progress.entity';
import { CreateTrainingMaterialDto, UpdateTrainingMaterialDto, UpdateUserProgressDto } from './dto/training.dto';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingMaterial)
    private trainingRepo: Repository<TrainingMaterial>,
    @InjectRepository(UserProgress)
    private progressRepo: Repository<UserProgress>,
  ) {}

  async create(dto: CreateTrainingMaterialDto, user: User): Promise<TrainingMaterial> {
    const material = this.trainingRepo.create({
      ...dto,
      createdById: user.id,
      status: dto.status || MaterialStatus.DRAFT,
    });
    return this.trainingRepo.save(material);
  }

  async findAll(status?: MaterialStatus): Promise<TrainingMaterial[]> {
    const query = this.trainingRepo.createQueryBuilder('material')
      .leftJoinAndSelect('material.createdBy', 'user')
      .orderBy('material.createdAt', 'DESC');
    
    if (status) {
      query.andWhere('material.status = :status', { status });
    }
    
    return query.getMany();
  }

  async findOne(id: string): Promise<TrainingMaterial> {
    const material = await this.trainingRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!material) {
      throw new NotFoundException('Материал не найден');
    }
    return material;
  }

  async update(id: string, dto: UpdateTrainingMaterialDto, user: User): Promise<TrainingMaterial> {
    const material = await this.findOne(id);
    
    // Проверка прав: только админ или создатель может редактировать
    if (user.role.name !== UserRole.ADMIN && user.role.name !== UserRole.SUPERADMIN && material.createdById !== user.id) {
      throw new ForbiddenException('Нет прав на редактирование');
    }

    Object.assign(material, dto);
    return this.trainingRepo.save(material);
  }

  async remove(id: string, user: User): Promise<void> {
    const material = await this.findOne(id);
    
    if (user.role.name !== UserRole.ADMIN && user.role.name !== UserRole.SUPERADMIN && material.createdById !== user.id) {
      throw new ForbiddenException('Нет прав на удаление');
    }

    await this.trainingRepo.remove(material);
  }

  async getProgress(userId: string, materialId: string): Promise<UserProgress | null> {
    return this.progressRepo.findOne({
      where: { userId, materialId },
      relations: ['material', 'user'],
    });
  }

  async updateProgress(userId: string, materialId: string, dto: UpdateUserProgressDto): Promise<UserProgress> {
    let progress = await this.getProgress(userId, materialId);
    
    if (!progress) {
      progress = this.progressRepo.create({
        userId,
        materialId,
        progressPercent: dto.progressPercent,
        completed: dto.completed || false,
      });
    } else {
      progress.progressPercent = dto.progressPercent;
      if (dto.completed !== undefined) {
        progress.completed = dto.completed;
        if (dto.completed) {
          progress.completedAt = new Date();
        }
      }
    }
    
    return this.progressRepo.save(progress);
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return this.progressRepo.find({
      where: { userId },
      relations: ['material'],
      orderBy: { startedAt: 'DESC' },
    });
  }
}
