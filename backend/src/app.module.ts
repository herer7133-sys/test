import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SensorsModule } from './sensors/sensors.module';

// Entities (will be created)
import { User } from './users/user.entity';
import { Role } from './users/role.entity';
import { Sensor } from './sensors/sensor.entity';
import { Party } from './common/party.entity';
import { Station } from './common/station.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'geocontrol',
      password: process.env.DATABASE_PASSWORD || 'secure_password_change_me',
      database: process.env.DATABASE_NAME || 'geocontrol_db',
      entities: [User, Role, Sensor, Party, Station],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    
    // Redis
    RedisModule.forRoot({
      type: 'single',
      url: `redis://:${process.env.REDIS_PASSWORD || 'secure_redis_password'}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 900000, // 15 minutes
        limit: 5, // 5 login attempts
        name: 'login',
      },
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 API requests
        name: 'api',
      },
    ]),
    
    // Cron jobs
    ScheduleModule.forRoot(),
    
    // Feature modules
    AuthModule,
    UsersModule,
    SensorsModule,
  ],
})
export class AppModule {}
