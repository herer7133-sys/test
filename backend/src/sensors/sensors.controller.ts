import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SensorsService } from './sensors.service';
import { CreateSensorDto, UpdateSensorDto, MoveSensorDto, SensorStatusDto } from './dto/sensor.dto';
import { Sensor } from './sensor.entity';

@ApiTags('sensors')
@Controller('sensors')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sensor (auto-generates token)' })
  @ApiResponse({ status: 201, description: 'Sensor created successfully' })
  @ApiResponse({ status: 400, description: 'Duplicate sensor' })
  async create(@Body() dto: CreateSensorDto): Promise<Sensor> {
    return this.sensorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sensors with filters' })
  @ApiResponse({ status: 200, description: 'List of sensors' })
  @ApiQuery({ name: 'status', required: false, enum: ['warehouse', 'in_transit', 'installed', 'maintenance', 'calibration', 'writeoff'] })
  @ApiQuery({ name: 'model', required: false })
  @ApiQuery({ name: 'stationId', required: false, type: Number })
  @ApiQuery({ name: 'calibrationDueSoon', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: string,
    @Query('model') model?: string,
    @Query('stationId', new ParseIntPipe({ optional: true })) stationId?: number,
    @Query('calibrationDueSoon') calibrationDueSoon?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ): Promise<{ sensors: Sensor[]; total: number }> {
    return this.sensorsService.findAll({
      status,
      model,
      stationId,
      calibrationDueSoon: calibrationDueSoon === 'true',
      page,
      limit,
    });
  }

  @Get('scan/:token')
  @ApiOperation({ summary: 'Scan sensor by token (public endpoint for QR scanning)' })
  @ApiParam({ name: 'token', type: String })
  @ApiResponse({ status: 200, description: 'Sensor found (minimal data)' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  // Remove AuthGuard for public access - implement separate public guard in production
  // @UseGuards() 
  async scanByToken(@Param('token', ParseUUIDPipe) token: string): Promise<any> {
    const sensor = await this.sensorsService.findByToken(token);
    
    if (!sensor) {
      return { found: false };
    }

    return {
      found: true,
      sensor: {
        id: sensor.id,
        serialNumber: sensor.serialNumber,
        model: sensor.model,
        status: sensor.status,
        calibrationDue: sensor.calibrationDue,
        location: sensor.currentLocation?.name || null,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sensor by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Sensor found' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Sensor> {
    return this.sensorsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sensor details' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Sensor updated' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSensorDto): Promise<Sensor> {
    return this.sensorsService.update(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update sensor status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SensorStatusDto,
  ): Promise<Sensor> {
    return this.sensorsService.updateStatus(id, dto.status);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Request sensor movement' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Movement request created' })
  async requestMove(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveSensorDto,
    @Request() req: any,
  ): Promise<any> {
    const movement = await this.sensorsService.requestMove(id, dto, req.user.id);
    return { message: 'Movement request created', movement };
  }

  @Post('move/:movementId/approve')
  @ApiOperation({ summary: 'Approve movement request (supervisor+ only)' })
  @ApiParam({ name: 'movementId', type: Number })
  @ApiResponse({ status: 200, description: 'Movement approved' })
  async approveMovement(
    @Param('movementId', ParseIntPipe) movementId: number,
    @Request() req: any,
  ): Promise<any> {
    const movement = await this.sensorsService.approveMovement(movementId, req.user.id);
    return { message: 'Movement approved', movement };
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Get sensor movement history' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Movement history' })
  async getMovementHistory(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    return this.sensorsService.getMovementHistory(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sensor (admin only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Sensor deleted' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    // In production: soft delete or move to writeoff status
    await this.sensorsService.updateStatus(id, 'writeoff');
    return { message: 'Sensor marked as writeoff' };
  }
}
