import { Injectable } from '@nestjs/common';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Region, RegionDocument } from './models/region.model';
import { Model } from 'mongoose';

@Injectable()
export class RegionsService {
  constructor(
    @InjectModel(Region.name)
    private readonly regionsModel: Model<RegionDocument>,
  ) {}
  async getAllRegions() {
    const regions = await this.regionsModel.find();
    return regions;
  }
}
