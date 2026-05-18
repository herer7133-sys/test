import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counterparty } from './entities/counterparty.entity';
import { CrmActivity, ActivityType } from './entities/crm-activity.entity';
import { CrmProject, ProjectStatus } from './entities/crm-project.entity';
import { CreateCounterpartyDto, UpdateCounterpartyDto, CreateActivityDto, CreateProjectDto, UpdateProjectDto } from './dto/crm.dto';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Counterparty)
    private readonly counterpartyRepo: Repository<Counterparty>,
    @InjectRepository(CrmActivity)
    private readonly activityRepo: Repository<CrmActivity>,
    @InjectRepository(CrmProject)
    private readonly projectRepo: Repository<CrmProject>,
  ) {}

  // Counterparties
  async createCounterparty(dto: CreateCounterpartyDto): Promise<Counterparty> {
    const counterparty = this.counterpartyRepo.create(dto);
    return this.counterpartyRepo.save(counterparty);
  }

  async findAllCounterparties(partyId?: string): Promise<Counterparty[]> {
    const query = this.counterpartyRepo.createQueryBuilder('cp');
    if (partyId) query.andWhere('cp.partyId = :partyId', { partyId });
    query.leftJoinAndSelect('cp.assignedTo', 'assignedTo');
    query.orderBy('cp.createdAt', 'DESC');
    return query.getMany();
  }

  async findOneCounterparty(id: string): Promise<Counterparty> {
    const cp = await this.counterpartyRepo.findOne({
      where: { id },
      relations: ['assignedTo', 'activities', 'projects'],
    });
    if (!cp) throw new NotFoundException('Counterparty not found');
    return cp;
  }

  async updateCounterparty(id: string, dto: UpdateCounterpartyDto): Promise<Counterparty> {
    const cp = await this.findOneCounterparty(id);
    Object.assign(cp, dto);
    return this.counterpartyRepo.save(cp);
  }

  async deleteCounterparty(id: string): Promise<void> {
    const cp = await this.findOneCounterparty(id);
    await this.counterpartyRepo.remove(cp);
  }

  // Activities
  async createActivity(dto: CreateActivityDto, userId: string): Promise<CrmActivity> {
    const activity = this.activityRepo.create({
      ...dto,
      createdById: userId,
    });
    return this.activityRepo.save(activity);
  }

  async findActivitiesByCounterparty(counterpartyId: string): Promise<CrmActivity[]> {
    return this.activityRepo.find({
      where: { counterpartyId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async completeActivity(id: string): Promise<CrmActivity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    activity.completedAt = new Date();
    return this.activityRepo.save(activity);
  }

  // Projects
  async createProject(dto: CreateProjectDto, userId: string): Promise<CrmProject> {
    const project = this.projectRepo.create({
      ...dto,
      managerId: userId,
    });
    return this.projectRepo.save(project);
  }

  async findAllProjects(partyId?: string, status?: ProjectStatus): Promise<CrmProject[]> {
    const query = this.projectRepo.createQueryBuilder('proj');
    if (partyId) query.andWhere('proj.partyId = :partyId', { partyId });
    if (status) query.andWhere('proj.status = :status', { status });
    query.leftJoinAndSelect('proj.manager', 'manager');
    query.leftJoinAndSelect('proj.counterparty', 'counterparty');
    query.orderBy('proj.createdAt', 'DESC');
    return query.getMany();
  }

  async findOneProject(id: string): Promise<CrmProject> {
    const proj = await this.projectRepo.findOne({
      where: { id },
      relations: ['manager', 'counterparty'],
    });
    if (!proj) throw new NotFoundException('Project not found');
    return proj;
  }

  async updateProject(id: string, dto: UpdateProjectDto): Promise<CrmProject> {
    const proj = await this.findOneProject(id);
    Object.assign(proj, dto);
    return this.projectRepo.save(proj);
  }

  async deleteProject(id: string): Promise<void> {
    const proj = await this.findOneProject(id);
    await this.projectRepo.remove(proj);
  }

  async getDashboardStats(partyId?: string): Promise<{
    counterpartiesCount: number;
    activeProjectsCount: number;
    pendingActivitiesCount: number;
  }> {
    const counterpartiesQuery = this.counterpartyRepo.createQueryBuilder('cp');
    if (partyId) counterpartiesQuery.where('cp.partyId = :partyId', { partyId });
    const counterpartiesCount = await counterpartiesQuery.getCount();

    const projectsQuery = this.projectRepo.createQueryBuilder('proj');
    if (partyId) projectsQuery.where('proj.partyId = :partyId', { partyId });
    const activeProjectsCount = await projectsQuery
      .andWhere('proj.status = :status', { status: ProjectStatus.ACTIVE })
      .getCount();

    const activitiesQuery = this.activityRepo.createQueryBuilder('act');
    const pendingActivitiesCount = await activitiesQuery
      .where('act.completedAt IS NULL')
      .andWhere('act.scheduledAt < NOW()')
      .getCount();

    return {
      counterpartiesCount,
      activeProjectsCount,
      pendingActivitiesCount,
    };
  }
}
