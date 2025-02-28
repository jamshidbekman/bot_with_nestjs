import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RamadanService } from './ramadan.service';
import { CreateRamadanDto } from './dto/create-ramadan.dto';
import { UpdateRamadanDto } from './dto/update-ramadan.dto';

@Controller('ramadan')
export class RamadanController {
  constructor(private readonly ramadanService: RamadanService) {}

}
