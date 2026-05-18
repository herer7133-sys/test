import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Sensor, SensorDocument, MovementRequest } from './sensor.entity';
import { Station } from '../common/station.entity';
import { CreateSensorDto, UpdateSensorDto, MoveSensorDto } from './dto/sensor.dto';

@Injectable()
export class SensorsService {
  constructor(
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(SensorDocument)
    private readonly documentRepository: Repository<SensorDocument>,
    @InjectRepository(MovementRequest)
    private readonly movementRepository: Repository<MovementRequest>,
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
  ) {}

  async create(dto: CreateSensorDto): Promise<Sensor> {
    // Check for duplicates
    const existing = await this.sensorRepository.findOne({
      where: {
        serialNumber: dto.serialNumber,
        model: dto.model,
      },
    });

    if (existing) {
      throw new BadRequestException('Sensor with this serial number and model already exists');
    }

    // Generate unique token (HMAC-SHA256 in production, UUID for now)
    const token = uuidv4();

    const sensor = this.sensorRepository.create({
      ...dto,
      token,
      status: 'warehouse',
      aiRiskScore: 0,
    });

    return this.sensorRepository.save(sensor);
  }

  async findAll(filters?: {
    status?: string;
    model?: string;
    stationId?: number;
    calibrationDueSoon?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ sensors: Sensor[]; total: number }> {
    const query = this.sensorRepository.createQueryBuilder('sensor')
      .leftJoinAndSelect('sensor.currentLocation', 'currentLocation')
      .leftJoinAndSelect('sensor.assignedStation', 'assignedStation')
      .leftJoinAndSelect('sensor.documents', 'documents');

    const where: FindOptionsWhere<Sensor> = {};

    if (filters?.status) {
      where.status = filters.status as any;
    }

    if (filters?.model) {
      where.model = filters.model;
    }

    if (filters?.stationId) {
      query.andWhere('(sensor.currentLocationId = :stationId OR sensor.assignedStationId = :stationId)', {
        stationId: filters.stationId,
      });
    }

    if (filters?.calibrationDueSoon) {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      query.andWhere('sensor.calibrationDue <= :date', { date: ninetyDaysFromNow });
    }

    query.where(where);

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    const [sensors, total] = await query.getManyAndCount();

    return { sensors, total };
  }

  async findOne(id: number): Promise<Sensor> {
    const sensor = await this.sensorRepository.findOne({
      where: { id },
      relations: ['currentLocation', 'assignedStation', 'documents'],
    });

    if (!sensor) {
      throw new NotFoundException('Sensor not found');
    }

    return sensor;
  }

  async findByToken(token: string): Promise<Sensor | null> {
    return this.sensorRepository.findOne({
      where: { token },
      relations: ['currentLocation', 'assignedStation'],
    });
  }

  async update(id: number, dto: UpdateSensorDto): Promise<Sensor> {
    const sensor = await this.findOne(id);

    Object.assign(sensor, dto);
    return this.sensorRepository.save(sensor);
  }

  async updateStatus(id: number, status: string): Promise<Sensor> {
    const validStatuses = ['warehouse', 'in_transit', 'installed', 'maintenance', 'calibration', 'writeoff'];
    
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const sensor = await this.findOne(id);
    sensor.status = status as any;
    return this.sensorRepository.save(sensor);
  }

  async requestMove(sensorId: number, dto: MoveSensorDto, userId: number): Promise<MovementRequest> {
    const sensor = await this.findOne(sensorId);
    const toStation = await this.stationRepository.findOne({ where: { id: dto.toLocationId } });

    if (!toStation) {
      throw new NotFoundException('Destination station not found');
    }

    const movement = this.movementRepository.create({
      sensorId,
      fromLocationId: sensor.currentLocationId,
      toLocationId: dto.toLocationId,
      status: 'pending',
      requestedById: userId,
      reason: dto.reason,
    });

    return this.movementRepository.save(movement);
  }

  async approveMovement(movementId: number, userId: number): Promise<MovementRequest> {
    const movement = await this.movementRepository.findOne({
      where: { id: movementId },
      relations: ['sensor', 'toLocation'],
    });

    if (!movement) {
      throw new NotFoundException('Movement request not found');
    }

    if (movement.status !== 'pending') {
      throw new BadRequestException('Movement request is not pending');
    }

    movement.status = 'approved';
    movement.approvedById = userId;

    // Update sensor location
    movement.sensor.currentLocationId = movement.toLocationId;
    
    await this.movementRepository.save(movement);
    await this.sensorRepository.save(movement.sensor);

    return movement;
  }

  async getMovementHistory(sensorId: number): Promise<MovementRequest[]> {
    return this.movementRepository.find({
      where: { sensorId },
      relations: ['fromLocation', 'toLocation', 'requestedBy', 'approvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSensorsNeedingCalibration(): Promise<Sensor[]> {
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    return this.sensorRepository.find({
      where: {
        calibrationDue: { 
          lte: ninetyDaysFromNow,
        },
        status: 'installed',
      },
      order: { calibrationDue: 'ASC' },
    });
  }

  async updateAiRiskScore(sensorId: number, score: number): Promise<Sensor> {
    if (score < 0 || score > 100) {
      throw new BadRequestException('AI risk score must be between 0 and 100');
    }

    const sensor = await this.findOne(sensorId);
    sensor.aiRiskScore = score;
    return this.sensorRepository.save(sensor);
  }
}
