import { Module } from '@nestjs/common';
import { BotModule } from './modules/bot/bot.module';
import { RamadanModule } from './modules/ramadan/ramadan.module';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { BotService } from './modules/bot/bot.service';
import { RegionsModule } from './modules/regions/regions.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get<string>('DB_URL'),
          dbName: configService.get<string>('DB_NAME'),
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot({
      cronJobs: true,
      intervals: true,
    }),
    BotModule,
    RamadanModule,
    UsersModule,
    RegionsModule,
    CalendarModule,
  ],
  controllers: [],
  providers: [BotService],
})
export class AppModule {}
