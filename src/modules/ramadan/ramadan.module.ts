import { Module } from '@nestjs/common';
import { RamadanService } from './ramadan.service';
import { RamadanController } from './ramadan.controller';

@Module({
  controllers: [RamadanController],
  providers: [RamadanService],
})
export class RamadanModule {}
