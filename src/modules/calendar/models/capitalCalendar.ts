import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type CapitalCalendarDocument = CapitalCalendar & Document;

@Schema()
export class CapitalCalendar extends Document {
  @Prop()
  region: string;

  @Prop()
  day: number;

  @Prop()
  date: string;

  @Prop()
  suhoor: string;

  @Prop()
  iftar: string;
}

export const CapitalCalendarSchema =
  SchemaFactory.createForClass(CapitalCalendar);
