import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Calendar, CalendarSchema } from './models/calendar.model';
import {
  CapitalCalendar,
  CapitalCalendarSchema,
} from './models/capitalCalendar';

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
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService, MongooseModule],
})
export class CalendarModule {}
