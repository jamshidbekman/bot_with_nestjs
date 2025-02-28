import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './models/user.model';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly usersModel: Model<UserDocument>,
  ) {}
  async createUser(user: any) {
    const findUser = await this.usersModel.findOne({ id: user.id });
    if (findUser) return;
    const createdUser = await this.usersModel.create(user);
    return createdUser;
  }

  async turnOnSchedule(user: any) {
    const findUser = await this.usersModel.findOne({ id: user.id });

    if (!findUser) throw new Error('user-not-found');

    if (!findUser.region) throw new Error('region-not-found');

    await this.usersModel.findByIdAndUpdate(findUser._id, { schedule: true });

    return true;
  }
  async turnOffSchedule(user: any) {
    const findUser = await this.usersModel.findOne({ id: user.id });

    if (!findUser) throw new Error('user-not-found');

    await this.usersModel.findByIdAndUpdate(findUser._id, { schedule: false });

    return true;
  }
  async updateRegion(user: any, region: string) {
    const findUser = await this.usersModel.findOne({ id: user.id });

    if (!findUser) throw new Error('user-not-found');

    await this.usersModel.findByIdAndUpdate(findUser._id, { region: region });
  }
  async getUserByTgId(id: number) {
    const user = await this.usersModel.findOne({ id: id });
    return user;
  }
  async getAllActiveUsers() {
    const users = await this.usersModel.find({ schedule: true });
    return users;
  }
}
