import {
  PlainDateBag,
  plainDateWithFields,
  refinePlainDateBag,
} from '../internal/bagRefine'
import {
  createNativeDateModOps,
  createNativeDateRefineOps,
  createNativeDiffOps,
  createNativeMonthDayRefineOps,
  createNativeMoveOps,
  createNativeYearMonthRefineOps,
} from '../internal/calendarNativeQuery'
import { compareIsoDateFields, plainDatesEqual } from '../internal/compare'
import { constructPlainDateSlots } from '../internal/construct'
import {
  plainDateToPlainDateTime,
  plainDateToPlainMonthDay,
  plainDateToPlainYearMonth,
  plainDateToZonedDateTime,
} from '../internal/convert'
import { diffPlainDates } from '../internal/diff'
import { DateBag, DateFields } from '../internal/fields'
import { createFormatPrepper, dateConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatPlainDateIso } from '../internal/isoFormat'
import { computeIsoDayOfWeek, computeIsoDaysInWeek } from '../internal/isoMath'
import { parsePlainDate } from '../internal/isoParse'
import { slotsWithCalendar } from '../internal/modify'
import { movePlainDate } from '../internal/move'
import {
  CalendarDisplayOptions,
  DiffOptions,
  OverflowOptions,
} from '../internal/optionsRefine'
import { PlainDateSlots } from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { NumberSign, bindArgs, identity, memoize } from '../internal/utils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import * as PlainDateTimeFns from './plainDateTime'
import * as PlainMonthDayFns from './plainMonthDay'
import * as PlainTimeFns from './plainTime'
import * as PlainYearMonthFns from './plainYearMonth'
import {
  computeDateFields,
  computeDayOfYear,
  computeDaysInMonth,
  computeDaysInYear,
  computeInLeapYear,
  computeMonthsInYear,
  computeWeekOfYear,
  computeYearOfWeek,
  getCalendarIdFromBag,
  refineCalendarIdString,
  refineTimeZoneIdString,
} from './utils'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = Readonly<PlainDateSlots<string>>
export type Fields = DateFields
export type Bag = DateBag
export type BagWithCalendar = PlainDateBag<string>

export const create = bindArgs(
  constructPlainDateSlots<string, string>,
  refineCalendarIdString,
) as (
  isoYear: number,
  isoMonth: number,
  isoDay: number,
  calendar?: string,
) => Record

export const fromString = parsePlainDate as (s: string) => Record

export function fromFields(
  fields: BagWithCalendar,
  options?: OverflowOptions, // ???
): Record {
  return refinePlainDateBag(
    createNativeDateRefineOps(getCalendarIdFromBag(fields)),
    fields,
    options,
  )
}

export const getFields = memoize(computeDateFields, WeakMap) as (
  record: Record,
) => Fields

export function withFields(
  record: Record,
  fields: Bag,
  options?: OverflowOptions, // ???
): Record {
  return plainDateWithFields(
    createNativeDateModOps,
    record,
    getFields(record),
    fields,
    options,
  )
}

export function withCalendar(record: Record, calendar: string): Record {
  return slotsWithCalendar(record, refineCalendarIdString(calendar))
}

export const dayOfWeek = computeIsoDayOfWeek as (record: Record) => number

export const daysInWeek = computeIsoDaysInWeek as (record: Record) => number

export const weekOfYear = computeWeekOfYear as (
  record: Record,
) => number | undefined

export const yearOfWeek = computeYearOfWeek as (
  record: Record,
) => number | undefined

export const dayOfYear = computeDayOfYear as (record: Record) => number

export const daysInMonth = computeDaysInMonth as (record: Record) => number

export const daysInYear = computeDaysInYear as (record: Record) => number

export const monthsInYear = computeMonthsInYear as (record: Record) => number

export const inLeapYear = computeInLeapYear as (record: Record) => boolean

export const add = bindArgs(
  movePlainDate<string>,
  createNativeMoveOps,
  false,
) as (
  plainDateRecord: Record,
  durationRecord: DurationFns.Record,
  options?: OverflowOptions,
) => Record

export const subtract = bindArgs(
  movePlainDate<string>,
  createNativeMoveOps,
  true,
) as (
  plainDateRecord: Record,
  durationRecord: DurationFns.Record,
  options?: OverflowOptions,
) => Record

export const until = bindArgs(
  diffPlainDates<string>,
  createNativeDiffOps,
  false,
) as (
  record0: Record,
  record1: Record,
  options?: DiffOptions,
) => DurationFns.Record

export const since = bindArgs(
  diffPlainDates<string>,
  createNativeDiffOps,
  true,
) as (
  record0: Record,
  record1: Record,
  options?: DiffOptions,
) => DurationFns.Record

export const equals = plainDatesEqual<string> as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareIsoDateFields as (
  record0: Record,
  record1: Record,
) => NumberSign

export function toZonedDateTime(
  record: Record,
  options: string | { timeZone: string; plainTime?: PlainTimeFns.Record },
): ZonedDateTimeFns.Record {
  const optionsObj =
    typeof options === 'string' ? { timeZone: options } : options

  return plainDateToZonedDateTime(
    refineTimeZoneIdString,
    identity,
    queryNativeTimeZone,
    record,
    optionsObj,
  )
}

export const toPlainDateTime = plainDateToPlainDateTime as (
  plainDateRecord: Record,
  plainTimeRecord?: PlainTimeFns.Record,
) => PlainDateTimeFns.Record

export function toPlainYearMonth(record: Record): PlainYearMonthFns.Record {
  return plainDateToPlainYearMonth(
    createNativeYearMonthRefineOps,
    record,
    getFields(record),
  )
}

export function toPlainMonthDay(record: Record): PlainMonthDayFns.Record {
  return plainDateToPlainMonthDay(
    createNativeMonthDayRefineOps,
    record,
    getFields(record),
  )
}

export const toString = formatPlainDateIso<string> as (
  record: Record,
  options?: CalendarDisplayOptions,
) => string

// Intl Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  dateConfig,
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
