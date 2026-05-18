import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto, CreateFolderDto, MoveDocumentDto } from './dto/document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('folders')
  @ApiOperation({ summary: 'Создать папку' })
  async createFolder(@Body() dto: CreateFolderDto, @Request() req) {
    return this.documentsService.createFolder(dto, req.user.id);
  }

  @Get('folders')
  @ApiOperation({ summary: 'Получить список папок' })
  async getFolders(
    @Query('partyId') partyId?: string,
    @Query('stationId') stationId?: string,
  ) {
    return this.documentsService.getFolders(partyId, stationId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузить документ' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.documentsService.uploadDocument(dto, file, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список документов с фильтрами' })
  async findAll(
    @Query('folderId') folderId?: string,
    @Query('partyId') partyId?: string,
    @Query('stationId') stationId?: string,
    @Query('tags') tags?: string,
  ) {
    const tagsArray = tags ? tags.split(',') : undefined;
    return this.documentsService.findAll({ folderId, partyId, stationId, tags: tagsArray });
  }

  @Get('search')
  @ApiOperation({ summary: 'Поиск документов' })
  async search(
    @Query('q') query: string,
    @Query('partyId') partyId?: string,
  ) {
    return this.documentsService.search(query, partyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить документ по ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Получить ссылку для скачивания' })
  async getDownloadUrl(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.documentsService.getDownloadUrl(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить метаданные документа' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentDto, @Request() req) {
    return this.documentsService.update(id, dto, req.user.id);
  }

  @Post(':id/version')
  @ApiOperation({ summary: 'Загрузить новую версию документа' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('changeDescription') changeDescription: string,
    @Request() req,
  ) {
    return this.documentsService.createVersion(id, file, req.user.id, changeDescription);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить документ' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.documentsService.delete(id, req.user.id);
  }
}
