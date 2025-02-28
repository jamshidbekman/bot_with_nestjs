import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type CalendarDocument = Calendar & Document;

@Schema()
export class Calendar extends Document {
  @Prop()
  originalId: mongoose.Schema.Types.ObjectId;

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

  @Prop()
  baseRegion: string;

  @Prop()
  adjustment: number;

  @Prop()
  operation: string;
}

export const CalendarSchema = SchemaFactory.createForClass(Calendar);
