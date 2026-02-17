import { Base, WithPopulated, SelectResult } from 'src/db/dto/base.dto';
import { PaginatedQuery, PaginatedResponse } from 'src/db/dto/query.dto';

export interface IBaseRepository<
  T extends Base,
  TRefs extends Record<string, unknown> = Record<string, unknown>,
> {
  find<K extends string = string, P extends string = never>(
    query: PaginatedQuery<K, P>,
  ): Promise<PaginatedResponse<WithPopulated<T, TRefs, P>, K | P>>;

  findById<K extends string = string, P extends string = never>(
    id: string,
    options?: { select?: K[]; populate?: P[] },
  ): Promise<SelectResult<
    WithPopulated<T, TRefs, NoInfer<P>>,
    NoInfer<K> | NoInfer<P>
  > | null>;

  create(doc: Omit<T, 'id'>): Promise<T>;

  updateById(id: string, update: Partial<T>): Promise<boolean>;

  deleteById(id: string): Promise<boolean>;
}
