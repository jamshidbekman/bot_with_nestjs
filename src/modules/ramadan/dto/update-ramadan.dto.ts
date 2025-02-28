import { PartialType } from '@nestjs/mapped-types';
import { CreateRamadanDto } from './create-ramadan.dto';

export class UpdateRamadanDto extends PartialType(CreateRamadanDto) {}
