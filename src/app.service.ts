import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users.repository';

@Injectable()
export class AppService {
  constructor(private usersRepository: UsersRepository) {}

  async getHello() {
    const res = await this.usersRepository.findById(
      'ewsn5e6LexlPekf1ZKZV4rvAF9KuV2O4',
      { select: ['userId.companyId'], populate: ['userId.companyId'] },
    );

    return res;
  }
}
