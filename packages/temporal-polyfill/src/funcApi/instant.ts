import { requireObjectLike } from '../internal/cast'
import { compareInstants, instantsEqual } from '../internal/compare'
import { constructInstantSlots } from '../internal/construct'
import {
  epochMicroToInstant,
  epochMilliToInstant,
  epochNanoToInstant,
  epochSecToInstant,
  instantToZonedDateTime,
} from '../internal/convert'
import { diffInstants } from '../internal/diff'
import { DurationFieldName } from '../internal/durationFields'
import { createFormatPrepper, instantConfig } from '../internal/intlFormatPrep'
import { LocalesArg } from '../internal/intlFormatUtils'
import { formatInstantIso } from '../internal/isoFormat'
import { parseInstant } from '../internal/isoParse'
import { moveInstant } from '../internal/move'
import {
  DiffOptions,
  InstantDisplayOptions,
  RoundingOptions,
} from '../internal/optionsRefine'
import { roundInstant } from '../internal/round'
import {
  InstantSlots,
  getEpochMicro,
  getEpochMilli,
  getEpochNano,
  getEpochSec,
} from '../internal/slots'
import { queryNativeTimeZone } from '../internal/timeZoneNative'
import { UnitName } from '../internal/units'
import { NumberSign, bindArgs } from '../internal/utils'
import * as DurationFns from './duration'
import { createFormatCache } from './intlFormatCache'
import { refineCalendarIdString, refineTimeZoneIdString } from './utils'
import * as ZonedDateTimeFns from './zonedDateTime'

export type Record = Readonly<InstantSlots>

export type DifferenceOptions = DiffOptions
export type RoundOptions = RoundingOptions // TODO: more specific
export type ToStringOptions = InstantDisplayOptions<string>
export type ToZonedDateTimeOptions = {
  timeZone: string
  calendar: string
}

// Creation / Parsing
// -----------------------------------------------------------------------------

export const create = constructInstantSlots as (
  epochNanoseconds: bigint,
) => Record

export const fromEpochSeconds = epochSecToInstant as (
  epochSeconds: number,
) => Record

export const fromEpochMilliseconds = epochMilliToInstant as (
  epochMilliseconds: number,
) => Record

export const fromEpochMicroseconds = epochMicroToInstant as (
  epochMicroseconds: bigint,
) => Record

export const fromEpochNanoseconds = epochNanoToInstant as (
  epochNanoseconds: bigint,
) => Record

export const fromString = parseInstant as (s: string) => Record

// Getters
// -----------------------------------------------------------------------------

export const epochSeconds = getEpochSec as (record: Record) => number

export const epochMilliseconds = getEpochMilli as (record: Record) => number

export const epochMicroseconds = getEpochMicro as (record: Record) => bigint

export const epochNanoseconds = getEpochNano as (record: Record) => bigint

// Math
// -----------------------------------------------------------------------------

export const add = bindArgs(moveInstant, false) as (
  instantRecord: Record,
  durationRecord: DurationFns.Record,
) => Record

export const subtract = bindArgs(moveInstant, true) as (
  instantRecord: Record,
  durationRecord: DurationFns.Record,
) => Record

export const until = bindArgs(diffInstants, false) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const since = bindArgs(diffInstants, true) as (
  record0: Record,
  record1: Record,
  options?: DifferenceOptions,
) => DurationFns.Record

export const round = roundInstant as (
  record: Record,
  options?: UnitName | DurationFieldName | RoundOptions,
) => Record

export const equals = instantsEqual as (
  record0: Record,
  record1: Record,
) => boolean

export const compare = compareInstants as (
  record0: Record,
  record1: Record,
) => NumberSign

// Conversion
// -----------------------------------------------------------------------------

export function toZonedDateTime(
  record: Record,
  options: ToZonedDateTimeOptions,
): ZonedDateTimeFns.Record {
  const refinedObj = requireObjectLike(options)

  return instantToZonedDateTime(
    record,
    refineTimeZoneIdString(refinedObj.timeZone),
    refineCalendarIdString(refinedObj.calendar),
  )
}

export function toZonedDateTimeISO(
  record: Record,
  timeZone: string,
): ZonedDateTimeFns.Record {
  return instantToZonedDateTime(record, refineTimeZoneIdString(timeZone))
}

// Formatting
// -----------------------------------------------------------------------------

const prepFormat = createFormatPrepper(
  instantConfig,
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

export const toString = bindArgs(
  formatInstantIso<string, string>,
  refineTimeZoneIdString,
  queryNativeTimeZone,
) as (record: Record, options?: ToStringOptions) => string
