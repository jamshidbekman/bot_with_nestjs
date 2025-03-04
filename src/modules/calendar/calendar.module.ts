import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Calendar, CalendarSchema } from './models/calendar.model';
import {
  CapitalCalendar,
  CapitalCalendarSchema,
} from './models/capitalCalendar';
import { User, UserSchema } from '../users/models/user.model';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Calendar.name,
        schema: CalendarSchema,
      },
      {
        name: CapitalCalendar.name,
        schema: CapitalCalendarSchema,
      },
    ]),
    UsersModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService, UsersService],
  exports: [CalendarService, MongooseModule],
})
export class CalendarModule {}
