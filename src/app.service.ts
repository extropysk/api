import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users.repository';

@Injectable()
export class AppService {
  constructor(private usersRepository: UsersRepository) {}

  async getHello() {
    const res = await this.usersRepository.find({
      page: 1,
      limit: 10,
      select: ['id', 'userId'],
    });

    return res;
  }
}
