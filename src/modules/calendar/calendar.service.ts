import { Injectable } from '@nestjs/common';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Calendar, CalendarDocument } from './models/calendar.model';
import { Model } from 'mongoose';
import * as moment from 'moment-timezone';
import {
  CapitalCalendar,
  CapitalCalendarDocument,
} from './models/capitalCalendar';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Calendar.name)
    private readonly calendarModel: Model<CalendarDocument>,
    @InjectModel(CapitalCalendar.name)
    private readonly capitalCalendarModel: Model<CapitalCalendarDocument>,
  ) {}

  async getCalendarByRegion(region: string) {
    const today = moment().tz('Asia/Tashkent').format('YYYY-MM-DD');
    if (region === 'Toshkent shahri') {
      const calendar = await this.capitalCalendarModel.findOne({
        date: today,
        region: region,
      });

      return calendar;
    }
    const calendar = await this.calendarModel.findOne({
      date: today,
      region: region,
    });

    return calendar;
  }
}
