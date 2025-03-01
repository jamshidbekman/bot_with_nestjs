import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ versionKey: false })
export class User {
  @Prop({ required: true })
  id: number;

  @Prop()
  first_name?: string;

  @Prop()
  last_name?: string;

  @Prop()
  username?: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  title?: string;

  @Prop()
  all_members_are_administrators?: boolean;

  @Prop({ default: true })
  schedule: boolean;

  @Prop({ default: null })
  region: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
