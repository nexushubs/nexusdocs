export enum VarType {
  String = 'string',
  Integer = 'integer',
  Object = 'object',
  Array = 'array',
  Boolean = 'boolean',
}

export type ValidateCallback = (schema: VarSchema, post: any) => {};

export type ObjectPropertySchema = { [key: string]: VarSchema }

export interface VarSchema {
  type: string;
  optional?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  exactLength?: number;
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  eq?: number;
  ne?: number;
  someKeys?: string[];
  strict?: boolean;
  exec?: ValidateCallback | ValidateCallback[];
  properties?: ObjectPropertySchema;
  items?: VarSchema | VarSchema[];
  alias?: string;
  error?: string;
  code?: string;
}
