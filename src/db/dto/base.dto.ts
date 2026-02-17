import { ApiProperty } from '@nestjs/swagger';

export interface Base {
  id: string;
}

export class BaseDto implements Base {
  @ApiProperty({ format: 'uuid' })
  id: string;
}

export type SelectResult<
  T extends Base,
  K extends string = string,
> = string extends K ? T : Pick<T, K & keyof T>;
