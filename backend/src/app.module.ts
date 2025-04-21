import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { PaymentsModule } from './payments/payments.module';
import { CoursesModule } from './courses/courses.module';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { RawBodyMiddleware } from './common/middleware/raw-body.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dbName: configService.get('MIKRO_ORM_DB_NAME'),
        user: configService.get('MIKRO_ORM_USER'),
        password: configService.get('MIKRO_ORM_PASSWORD'),
        host: configService.get('MIKRO_ORM_HOST'),
        port: configService.get('MIKRO_ORM_PORT'),
        type: 'postgresql',
        autoLoadEntities: true,
        migrations: {
          path: './dist/migrations',
          pathTs: './src/migrations',
        },
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    SchedulingModule,
    PaymentsModule,
    CoursesModule,
    EmailModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply raw body middleware for Stripe webhooks
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({ path: 'api/payments/stripe/webhook', method: RequestMethod.POST });
  }
}