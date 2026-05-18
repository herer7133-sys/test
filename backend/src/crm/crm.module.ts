import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { Counterparty } from './entities/counterparty.entity';
import { CrmActivity } from './entities/crm-activity.entity';
import { CrmProject } from './entities/crm-project.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Counterparty, CrmActivity, CrmProject]),
    AuthModule,
  ],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
