import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users.repository';

@Injectable()
export class AppService {
  constructor(private usersRepository: UsersRepository) {}

  async getHello() {
    const a = await this.usersRepository.findById(
      'lwL9wJ1ZDaZAszC6UhAUKRxIe1Sm9Iqc',
      { populate: [], select: ['userId'] },
    );
    return a;
  }
}
