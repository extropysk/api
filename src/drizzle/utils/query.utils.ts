import {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  ilike,
  inArray,
  notInArray,
  isNotNull,
  isNull,
  and,
  or,
  asc,
  desc,
  SQL,
} from 'drizzle-orm';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';

type PayloadOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_equal'
  | 'less_than'
  | 'less_than_equal'
  | 'like'
  | 'contains'
  | 'in'
  | 'not_in'
  | 'exists';

const operatorNames: PayloadOperator[] = [
  'equals',
  'not_equals',
  'greater_than',
  'greater_than_equal',
  'less_than',
  'less_than_equal',
  'like',
  'contains',
  'in',
  'not_in',
  'exists',
];

function getColumn(table: PgTable, fieldName: string): PgColumn | undefined {
  const columns =
    (table as any)[Symbol.for('drizzle:Columns')] ||
    Object.values(table as any).filter(
      (v: any) => v?.constructor?.name === 'PgColumn',
    );

  if (Array.isArray(columns)) {
    return undefined;
  }

  // Try direct property access on the table
  return (table as any)[fieldName];
}

function applyOperator(
  column: PgColumn,
  operator: PayloadOperator,
  value: unknown,
): SQL {
  switch (operator) {
    case 'equals':
      return eq(column, value);
    case 'not_equals':
      return ne(column, value);
    case 'greater_than':
      return gt(column, value);
    case 'greater_than_equal':
      return gte(column, value);
    case 'less_than':
      return lt(column, value);
    case 'less_than_equal':
      return lte(column, value);
    case 'like':
    case 'contains':
      return ilike(column, `%${value as string}%`);
    case 'in':
      return inArray(column, value as any[]);
    case 'not_in':
      return notInArray(column, value as any[]);
    case 'exists':
      return value ? isNotNull(column) : isNull(column);
  }
}

export function convertWhereToDrizzle(
  where: Record<string, unknown>,
  table: PgTable,
): SQL | undefined {
  const conditions: SQL[] = [];

  for (const [key, value] of Object.entries(where)) {
    if (key === 'and' && Array.isArray(value)) {
      const subConditions = value
        .map((condition) =>
          convertWhereToDrizzle(condition as Record<string, unknown>, table),
        )
        .filter(Boolean) as SQL[];
      if (subConditions.length > 0) {
        conditions.push(and(...subConditions)!);
      }
    } else if (key === 'or' && Array.isArray(value)) {
      const subConditions = value
        .map((condition) =>
          convertWhereToDrizzle(condition as Record<string, unknown>, table),
        )
        .filter(Boolean) as SQL[];
      if (subConditions.length > 0) {
        conditions.push(or(...subConditions)!);
      }
    } else if (typeof value === 'object' && value !== null) {
      const operators = Object.keys(value) as PayloadOperator[];
      const isOperatorObject = operators.some((op) =>
        operatorNames.includes(op),
      );

      if (isOperatorObject) {
        const column = getColumn(table, key);
        if (column) {
          for (const op of operators) {
            if (operatorNames.includes(op)) {
              const opValue = (value as Record<string, unknown>)[op];
              conditions.push(applyOperator(column, op, opValue));
            }
          }
        }
      } else {
        const nested = convertWhereToDrizzle(
          value as Record<string, unknown>,
          table,
        );
        if (nested) conditions.push(nested);
      }
    } else {
      const column = getColumn(table, key);
      if (column) {
        conditions.push(eq(column, value));
      }
    }
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export function convertSortToDrizzle(sort: string | undefined, table: PgTable) {
  if (!sort) return undefined;

  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;

  const column = getColumn(table, field);
  if (!column) return undefined;

  return descending ? desc(column) : asc(column);
}

export function selectFields<T extends Record<string, any>>(
  doc: T,
  select?: string,
): Partial<T> {
  if (!select) return doc;

  const fields = select.split(',').map((f) => f.trim());
  const result: Partial<T> = {};

  for (const field of fields) {
    if (field in doc) {
      result[field as keyof T] = doc[field as keyof T];
    }
  }

  return result;
}

/**
 * Parse `where` query parameter that can come in two formats:
 * 1. JSON string: where={"sub":{"equals":"user-001"}}
 * 2. Bracket notation (already parsed by NestJS): where[sub][equals]=user-001
 */
export function parseWhereParam(
  where: string | Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!where) return undefined;

  if (typeof where === 'object') {
    return Object.keys(where).length > 0 ? where : undefined;
  }

  if (typeof where === 'string') {
    try {
      const parsed = JSON.parse(where);
      return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}
