import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { ConfigModule } from '@nestjs/config';
import { RegionsModule } from '../regions/regions.module';
import { RegionsService } from '../regions/regions.service';
import { CalendarModule } from '../calendar/calendar.module';
import { CalendarService } from '../calendar/calendar.service';

@Module({
  imports: [UsersModule, ConfigModule, RegionsModule, CalendarModule],
  controllers: [BotController],
  providers: [BotService, UsersService, RegionsService, CalendarService],
  exports: [BotService],
})
export class BotModule {}
