/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { eq, count as drizzleCount, getTableName, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import {
  Base,
  SelectResult,
  WithPopulated,
  PopulateKeys,
  RefNode,
} from 'src/db/dto/base.dto';
import { IBaseRepository } from 'src/db/base.repository.interface';
import { PaginatedQuery, PaginatedResponse } from 'src/db/dto/query.dto';

import {
  convertWhereToDrizzle,
  convertSortToDrizzle,
} from './utils/query.utils';
import { Db } from 'src/db';

interface RelationalOptions {
  columns?: Record<string, boolean>;
  with?: Record<string, boolean | object>;
}

interface FindOptions extends RelationalOptions {
  limit?: number;
  offset?: number;
  orderBy?: SQL;
}

function parseSelect(select: string[]): RelationalOptions {
  const columns: Record<string, boolean> = {};
  const withMap: Record<string, Record<string, boolean>> = {};

  for (const field of select) {
    const dot = field.indexOf('.');
    if (dot === -1) {
      columns[field] = true;
    } else {
      const relation = field.slice(0, dot);
      const column = field.slice(dot + 1);
      withMap[relation] = withMap[relation] ?? {};
      withMap[relation][column] = true;
    }
  }

  const withRelations: Record<string, object> = {};
  for (const [relation, cols] of Object.entries(withMap)) {
    withRelations[relation] = { columns: cols };
  }

  return {
    ...(Object.keys(columns).length > 0 && { columns }),
    ...(Object.keys(withRelations).length > 0 && { with: withRelations }),
  };
}

function parsePopulate(populate: string[]): Record<string, boolean | object> {
  const root: Record<string, any> = {};

  for (const path of populate) {
    const parts = path.split('.');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current[part] = current[part] ?? true;
      } else {
        if (current[part] === undefined || current[part] === true) {
          current[part] = {};
        }
        if (!current[part].with) {
          current[part].with = {};
        }
        current = current[part].with;
      }
    }
  }

  return root;
}

export function toRelationalOptions(
  select?: string[],
  populate?: string[],
): RelationalOptions {
  const result: RelationalOptions = {};

  if (select) {
    const { columns, with: withRel } = parseSelect(select);
    if (columns) result.columns = columns;
    if (withRel) result.with = { ...result.with, ...withRel };
  }

  if (populate) {
    const populated = parsePopulate(populate);
    result.with = { ...result.with, ...populated };
  }

  return result;
}

export abstract class BaseRepository<
  TTable extends PgTable & { id: any },
  TRelations extends Record<string, RefNode> = Record<string, RefNode>,
  TSelect extends Base = TTable['$inferSelect'] & Base,
  TInsert = TTable['$inferInsert'],
> implements IBaseRepository<TSelect, TRelations> {
  protected db: Db;
  protected table: TTable;
  protected tableName: string;

  constructor(db: Db, table: TTable) {
    this.db = db;
    this.table = table;
    this.tableName = getTableName(table);
  }

  private get queryTable() {
    return (this.db.query as any)[this.tableName];
  }

  async findMany<TResult = TSelect>(
    where?: SQL,
    options: FindOptions = {},
  ): Promise<TResult[]> {
    const queryOptions: any = {};

    if (where) queryOptions.where = where;
    if (options.columns) queryOptions.columns = options.columns;
    if (options.with) queryOptions.with = options.with;
    if (options.orderBy) queryOptions.orderBy = options.orderBy;
    if (options.limit !== undefined) queryOptions.limit = options.limit;
    if (options.offset !== undefined) queryOptions.offset = options.offset;

    return this.queryTable.findMany(queryOptions) as Promise<TResult[]>;
  }

  async find<K extends string = string, P extends string = never>(
    query: PaginatedQuery<K, P>,
  ): Promise<
    PaginatedResponse<
      WithPopulated<TSelect, TRelations, P>,
      K | PopulateKeys<P>
    >
  > {
    const { where, sort, limit, page } = query;

    const whereClause = where
      ? convertWhereToDrizzle(where, this.table)
      : undefined;
    const orderBy = convertSortToDrizzle(sort, this.table);
    const offset = (page - 1) * limit;

    const { columns, with: withRelations } = toRelationalOptions(
      query.select,
      query.populate,
    );

    const totalDocs = await this.count(whereClause);
    const totalPages = Math.ceil(totalDocs / limit);

    const docs = (await this.findMany(whereClause, {
      offset,
      limit,
      orderBy,
      columns,
      with: withRelations,
    })) as unknown as SelectResult<
      WithPopulated<TSelect, TRelations, P>,
      K | PopulateKeys<P>
    >[];

    return {
      docs,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findOne(
    where: SQL,
    options?: { select?: string[]; populate?: string[] },
  ): Promise<any> {
    const { columns, with: withRelations } = toRelationalOptions(
      options?.select,
      options?.populate,
    );

    const queryOptions: any = { where };
    if (columns) queryOptions.columns = columns;
    if (withRelations) queryOptions.with = withRelations;

    const result = await this.queryTable.findFirst(queryOptions);
    return result ?? null;
  }

  async findById<K extends string = string, P extends string = never>(
    id: string,
    options?: { select?: K[]; populate?: P[] },
  ): Promise<SelectResult<
    WithPopulated<TSelect, TRelations, NoInfer<P>>,
    NoInfer<K> | PopulateKeys<NoInfer<P>>
  > | null> {
    return this.findOne(eq(this.table.id, id), options);
  }

  async count(where?: SQL): Promise<number> {
    let query = (
      this.db.select({ count: drizzleCount() }).from(this.table as any) as any
    ).$dynamic();

    if (where) {
      query = query.where(where);
    }

    const result = await query;
    return (result as any[])[0]?.count ?? 0;
  }

  async create(doc: Omit<TSelect, 'id'>): Promise<TSelect> {
    const result = await (
      this.db.insert(this.table as any).values(doc as any) as any
    ).returning();
    return result[0] as TSelect;
  }

  async updateOne(where: SQL, data: Partial<TSelect>): Promise<boolean> {
    const result = await (
      this.db
        .update(this.table as any)
        .set(data as any)
        .where(where) as any
    ).returning();
    return (result as any[]).length > 0;
  }

  async updateById(id: string, update: Partial<TSelect>): Promise<boolean> {
    return this.updateOne(eq(this.table.id, id), update);
  }

  async upsert(
    conflictTarget: any,
    data: TInsert,
    updateData?: Partial<TInsert>,
  ): Promise<TSelect> {
    const result = await (
      this.db
        .insert(this.table as any)
        .values(data as any)
        .onConflictDoUpdate({
          target: conflictTarget,
          set: (updateData ?? data) as any,
        }) as any
    ).returning();
    return result[0] as TSelect;
  }

  async deleteOne(where: SQL): Promise<boolean> {
    const result = await (
      this.db.delete(this.table as any).where(where) as any
    ).returning();
    return (result as any[]).length > 0;
  }

  async deleteById(id: string): Promise<boolean> {
    return this.deleteOne(eq(this.table.id, id));
  }
}
