import { Inject, Injectable } from '@nestjs/common';

import { BaseRepository } from 'src/drizzle/base.repository';

import { DATABASE } from '@extropysk/nest-pg';
import { Db } from 'src/db';
import { account, user } from 'src/db/auth-schema';

type AccountRelations = {
  userId: typeof user.$inferSelect;
};

@Injectable()
export class UsersRepository extends BaseRepository<typeof account> {
  constructor(@Inject(DATABASE) db: Db) {
    super(db, account);
  }
}
