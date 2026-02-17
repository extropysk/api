import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { SelectResult } from './base.dto';
import { parseWhereParam } from '../../drizzle/utils/query.utils';

const csvToArray = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.flatMap((v) => v.split(','));
    return val.split(',');
  });

export const PaginatedQuerySchema = z.object({
  where: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .optional()
    .transform((val) => parseWhereParam(val)),
  sort: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  page: z.coerce.number().int().positive().default(1),
  select: csvToArray,
  populate: csvToArray,
});

export class PaginatedQueryDto extends createZodDto(PaginatedQuerySchema) {}

export interface PaginatedQuery<
  K extends string = string,
  P extends string = string,
> {
  where?: Record<string, unknown>;
  sort?: string;
  limit: number;
  page: number;
  select?: K[];
  populate?: P[];
}

export interface PaginatedResponse<T, K extends string = string> {
  docs: SelectResult<T, K>[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
