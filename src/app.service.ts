import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users.repository';

@Injectable()
export class AppService {
  constructor(private usersRepository: UsersRepository) {}

  async getHello() {
    const res = await this.usersRepository.findById(
      'k2QFfA0bof8IkrEoX9Uh4KDbeDPAaG8d',
      { select: ['id'], populate: ['userId'] },
    );

    return res;
  }
}
