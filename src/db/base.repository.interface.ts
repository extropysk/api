import { Base, SelectResult } from 'src/db/dto/base.dto';
import { PaginatedQuery, PaginatedResponse } from 'src/db/dto/query.dto';

export interface IBaseRepository<T extends Base> {
  find<K extends string = string>(
    query: PaginatedQuery<K>,
  ): Promise<PaginatedResponse<T, K>>;

  findById<K extends string = string>(
    id: string,
    options?: { select?: K[]; populate?: string[] },
  ): Promise<SelectResult<T, K> | null>;

  create(doc: Omit<T, 'id'>): Promise<T>;

  updateById(id: string, update: Partial<T>): Promise<boolean>;

  deleteById(id: string): Promise<boolean>;
}
