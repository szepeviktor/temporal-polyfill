import {
  PlainYearMonthBag,
  plainYearMonthWithFields,
  refinePlainYearMonthBag,
} from '../internal/bagRefine'
import {
  createNativeDateModOps,
  createNativeYearMonthDiffOps,
  createNativeYearMonthModOps,
  createNativeYearMonthMoveOps,
  createNativeYearMonthParseOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import { compareIsoDateFields, plainYearMonthsEqual } from '../internal/compare'
import { constructPlainYearMonthSlots } from '../internal/construct'
import { plainYearMonthToPlainDate } from '../internal/convert'
import { diffPlainYearMonth } from '../internal/diff'
import { YearMonthBag, YearMonthFields } from '../internal/fields'
import {
  createFormatPrepper,
  yearMonthConfig,
} from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainYearMonthIso } from '../internal/isoFormat'
import { parsePlainYearMonth } from '../internal/isoParse'
import { movePlainYearMonth } from '../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../internal/optionsRefine'
import { PlainYearMonthSlots } from '../internal/slots'
import { NumberSign, bindArgs, memoize } from '../internal/utils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateFns from './plainDate'
import {
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeYearMonthFields,
  getCalendarIdFromBag,
  refineCalendarIdString,
} from './utils'

export type Record = Readonly<PlainYearMonthSlots<string>>
export type Fields = YearMonthFields
export type Bag = YearMonthBag
export type BagWithCalendar = PlainYearMonthBag<string>

export const create = bindArgs(
  constructPlainYearMonthSlots<string, string>,
  refineCalendarIdString,
) as (
  isoYear: number,
  isoMonth: number,
  calendar?: string,
  referenceIsoDay?: number,
) => Record

export const fromString = bindArgs(
  parsePlainYearMonth,
  createNativeYearMonthParseOps,
) as (s: string) => Record

export function fromFields(
  bag: BagWithCalendar,
  options?: OverflowOptions,
): Record {
  return refinePlainYearMonthBag(
    createNativeYearMonthRefineOps(getCalendarIdFromBag(bag)),
    bag,
    options,
  )
}

export const getFields = memoize(computeYearMonthFields, WeakMap) as (
  record: Record,
) => Fields

export function withFields(
  record: Record,
  fields: Bag,
  options?: OverflowOptions,
): Record {
  return plainYearMonthWithFields(
    createNativeYearMonthModOps,
    record,
    getFields(record),
    fields,
    options,
  )
}

export const daysInMonth = computeDaysInMonth as (record: Record) => number

export const daysInYear = computeDaysInYear as (record: Record) => number

export const monthsInYear = computeMonthsInYear as (record: Record) => number

export const inLeapYear = computeInLeapYear as (record: Record) => boolean

export const add = bindArgs(
  movePlainYearMonth<string>,
  createNativeYearMonthMoveOps,
  false,
) as (
  plainYearMonthFields: Record,
  durationRecord: DurationFns.Record,
  options?: OverflowOptions,
) => Record

export const subtract = bindArgs(
  movePlainYearMonth<string>,
  createNativeYearMonthMoveOps,
  true,
) as (
  plainYearMonthFields: Record,
  durationRecord: DurationFns.Record,
  options?: OverflowOptions,
) => Record

export const until = bindArgs(
  diffPlainYearMonth<string>,
  createNativeYearMonthDiffOps,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: DiffOptions,
) => DurationFns.Record

export const since = bindArgs(
  diffPlainYearMonth<string>,
  createNativeYearMonthDiffOps,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: DiffOptions,
) => DurationFns.Record

export const equals = plainYearMonthsEqual<string> as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoDateFields as (
  record0: Record,
  record1: Record,
) => NumberSign

export function toPlainDate(
  record: Record,
  bag: { day: number },
): PlainDateFns.Record {
  return plainYearMonthToPlainDate(
    createNativeDateModOps,
    record,
    getFields(record),
    bag,
  )
}

export const toString = formatPlainYearMonthIso<string> as (
  record: Record,
  options?: CalendarDisplayOptions,
) => string

// Intl Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  yearMonthConfig,
  /*@__PURE__*/ createFormatCache(),
)

export function toLocaleString(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.format(epochMilli)
}

export function toLocaleStringParts(
  record: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli] = prepFormat(locales, options, record)
  return format.formatToParts(epochMilli)
}

export function rangeToLocaleString(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): string {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return (format as any).formatRange(epochMilli0, epochMilli1!)
}

export function rangeToLocaleStringParts(
  record0: Record,
  record1: Record,
  locales?: LocalesArg,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const [format, epochMilli0, epochMilli1] = prepFormat(
    locales,
    options,
    record0,
    record1,
  )
  return (format as any).formatRangeToParts(epochMilli0, epochMilli1!)
}
