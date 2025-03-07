import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RegionDocument = Region & Document;

@Schema()
export class Region {
  @Prop()
  region: string;
  @Prop()
  adjusment: number;
  @Prop()
  operation: string;
}

export const RegionSchema = SchemaFactory.createForClass(Region);
