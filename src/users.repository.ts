import { Inject, Injectable } from '@nestjs/common';

import { BaseRepository } from 'src/drizzle/base.repository';

import { DATABASE } from '@extropysk/nest-pg';
import { Db } from 'src/db';
import { account, company, user } from 'src/db/auth-schema';

type AccountRelations = {
  userId: typeof user.$inferSelect;
  'userId.companyId': typeof company.$inferSelect;
};

@Injectable()
export class UsersRepository extends BaseRepository<
  typeof account,
  AccountRelations
> {
  constructor(@Inject(DATABASE) db: Db) {
    super(db, account);
  }
}
