import { Inject, Injectable } from '@nestjs/common';

import { BaseRepository } from 'src/drizzle/base.repository';

import { DATABASE } from '@extropysk/nest-pg';
import { Db } from 'src/db';
import { account } from 'src/db/auth-schema';

@Injectable()
export class UsersRepository extends BaseRepository<typeof account> {
  constructor(@Inject(DATABASE) db: Db) {
    super(db, account);
  }
}
