import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users.repository';

@Injectable()
export class AppService {
  constructor(private usersRepository: UsersRepository) {}

  async getHello() {
    const res = await this.usersRepository.find({
      limit: 10,
      page: 1,
      select: ['id'],
      populate: ['userId'],
    });

    return res;
  }
}
