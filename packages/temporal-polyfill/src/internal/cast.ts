import { Callable, isObjectlike } from './utils'

// Require
// -------------------------------------------------------------------------------------------------

export function requireObjectlike<O extends {}>(arg: O): O {
  if (!isObjectlike(arg)) {
    throw new TypeError('Must be object-like');
  }
  return arg;
}

function requireType<A>(typeName: string, arg: A): A {
  if (typeof arg !== typeName) {
    throw new TypeError(`Must be certain type ${typeName}`);
  }
  return arg;
}

export const requireString = requireType.bind(undefined, 'string') as (arg: string) => string
export const requireBoolean = requireType.bind(undefined, 'boolean') as (arg: boolean) => boolean
export const requireNumber = requireType.bind(undefined, 'number') as (arg: number) => number
export const requireFunction = requireType.bind(undefined, 'function') as (arg: Callable) => Callable

export function requireStringOrUndefined(input: string | undefined): string | undefined {
  if (input !== undefined && typeof input !== 'string') {
    throw new TypeError('Must be string or undefined')
  }
  return input
}

export function requireIntegerOrUndefined(input: number | undefined): number | undefined {
  if (input === undefined) {
    // good
  } else if (typeof input === 'number') {
    if (!Number.isInteger(input)) {
      throw new RangeError('Cannot accept non-integer')
    }
  } else {
    throw new TypeError('Invalid type. Expected integer or undefined')
  }
  return input
}

export function requireInteger(arg: number): number {
  return requireNumberIsInteger(requireNumber(arg));
}

export function requirePositiveInteger(arg: number): number {
  return requireNumberIsPositive(requireInteger(arg))
}

function requireNumberIsInteger(num: number): number {
  if (!Number.isInteger(num)) {
    throw new RangeError('must be integer');
  }
  return num || 0; // ensure no -0... TODO: why???
}

function requireNumberIsPositive(num: number): number {
  if (num <= 0) {
    throw new RangeError('Must be positive')
  }
  return num
}

export function requireNotNullOrUndefined<T>(o: T): T {
  if (o == null) { // null or undefined
    throw TypeError('Cannot be null or undefined')
  }
  return o
}


// Casting
// -------------------------------------------------------------------------------------------------

export function toString(arg: string): string {
  if (typeof arg === 'symbol') {
    throw new TypeError('Symbol now allowed')
  }
  return String(arg)
}

export function toStringViaPrimitive(arg: string): string { // see ToPrimitiveAndRequireString
  if (isObjectlike(arg)) {
    return String(arg)
  }
  return requireString(arg)
}

export function toBigInt(bi: bigint): bigint {
  if (typeof bi === 'string') {
    return BigInt(bi)
  }
  if (typeof bi !== 'bigint') {
    throw new TypeError('Invalid bigint')
  }
  return bi
}

export function toNumber(arg: number): number {
  if (typeof arg === 'bigint') {
    throw new TypeError('Cannot convert bigint to number')
  }

  arg = Number(arg)

  if (isNaN(arg)) {
    throw new RangeError('not a number')
  }
  if (!Number.isFinite(arg)) {
    throw new RangeError('must be finite')
  }

  return arg
}

export function toInteger(arg: number): number {
  return Math.trunc(toNumber(arg)) || 0 // ensure no -0
}

export function toStrictInteger(arg: number): number {
  return requireNumberIsInteger(toNumber(arg))
}

export function toPositiveInteger(arg: number): number {
  return requireNumberIsPositive(toInteger(arg))
}
