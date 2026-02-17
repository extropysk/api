import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users.repository';

@Injectable()
export class AppService {
  constructor(private usersRepository: UsersRepository) {}

  async getHello(): Promise<{ userId: unknown } | null> {
    const a = await this.usersRepository.findById(
      'lwL9wJ1ZDaZAszC6UhAUKRxIe1Sm9Iqc',
      { select: ['id', 'userId'], populate: ['userId'] },
    );
    return a;
  }
}
