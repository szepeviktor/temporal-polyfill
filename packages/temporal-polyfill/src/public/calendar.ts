import { Temporal } from 'temporal-spec'
import {
  allDateFieldMap,
  allMonthDayFieldMap,
  allYearMonthFieldMap,
  dateFieldMap,
  dateTimeFieldMap,
  monthDayFieldMap,
  toString,
  yearMonthFieldMap,
} from '../argParse/fieldStr'
import { parseOverflowOption } from '../argParse/overflowHandling'
import { ensureOptionsObj, isObjectLike, refineFields } from '../argParse/refine'
import { parseUnit } from '../argParse/unitStr'
import { checkEpochMilliBuggy } from '../calendarImpl/bugs'
import { CalendarImpl, CalendarImplFields, convertEraYear } from '../calendarImpl/calendarImpl'
import { queryCalendarImpl } from '../calendarImpl/calendarImplQuery'
import { isoCalendarID } from '../calendarImpl/isoCalendarImpl'
import {
  JsonMethods,
  ensureObj,
  getISOFields,
  mixinJsonMethods,
  needReceiver,
} from '../dateUtils/abstract'
import {
  computeDayOfYear,
  computeDaysInYear,
  getExistingDateISOFields,
  queryDateFields,
  queryDateISOFields,
} from '../dateUtils/calendar'
import { diffDateFields } from '../dateUtils/diff'
import { computeISODayOfWeek, isoEpochLeapYear, isoToEpochMilli } from '../dateUtils/epoch'
import { attachStringTag } from '../dateUtils/mixins'
import { tryParseDateTime } from '../dateUtils/parse'
import { translateDate } from '../dateUtils/translate'
import { DAY, DateUnitInt, YEAR } from '../dateUtils/units'
import { computeWeekOfISOYear, computeYearOfISOWeek } from '../dateUtils/week'
import { createWeakMap } from '../utils/obj'
import { Duration, DurationArg, createDuration } from './duration'
import { PlainDate, PlainDateArg } from './plainDate'
import { PlainMonthDay } from './plainMonthDay'
import { PlainYearMonth } from './plainYearMonth'
import { TimeZone } from './timeZone'
import { getZonedDateTimeInterals } from './zonedDateTime'

// FYI: the Temporal.CalendarLike type includes `string`,
// unlike many other object types

const [getImpl, setImpl] = createWeakMap<Calendar, CalendarImpl>()
export { getImpl as getCalendarImpl }

export class Calendar implements Temporal.Calendar {
  constructor(id: string) {
    if (id === 'islamicc') { // deprecated... TODO: use conversion map
      id = 'islamic-civil'
    }

    setImpl(this, queryCalendarImpl(id))
  }

  static from(arg: Temporal.CalendarLike): Temporal.CalendarProtocol {
    return calendarFrom(arg)
  }

  get id(): string {
    needReceiver(Calendar, this)
    return getImpl(this).id
  }

  era(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): string | undefined {
    needReceiver(Calendar, this)
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).era
  }

  eraYear(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number | undefined {
    needReceiver(Calendar, this)
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).eraYear
  }

  year(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): number {
    needReceiver(Calendar, this)
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).year
  }

  month(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainMonthDay
    | Temporal.PlainDateLike
    | string,
  ): number {
    needReceiver(Calendar, this)
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).month
  }

  monthCode(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainMonthDay
    | Temporal.PlainDateLike
    | string,
  ): string {
    needReceiver(Calendar, this)
    const fields = queryDateFields(arg, this)
    return getImpl(this).monthCode(fields.month, fields.year)
  }

  day(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainMonthDay
    | Temporal.PlainDateLike
    | string,
  ): number {
    needReceiver(Calendar, this)
    const isoFields = getExistingDateISOFields(arg)
    return isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    ).day
  }

  dayOfWeek(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    needReceiver(Calendar, this)
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return computeISODayOfWeek(isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay)
  }

  dayOfYear(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    needReceiver(Calendar, this)
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return computeDayOfYear(getImpl(this), fields.year, fields.month, fields.day)
  }

  weekOfYear(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    needReceiver(Calendar, this)
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return computeWeekOfISOYear(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      1, // TODO: document what this means
      4, // "
    )
  }

  yearOfWeek(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    needReceiver(Calendar, this)
    const isoFields = getExistingDateISOFields(arg, true) // disallowMonthDay=true
    return computeYearOfISOWeek(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      1, // TODO: document what this means
      4, // "
    )
  }

  daysInWeek(
    arg: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.PlainDateLike | string,
  ): number {
    needReceiver(Calendar, this)

    // will throw error if invalid type
    getExistingDateISOFields(arg, true) // disallowMonthDay=true

    // All calendars seem to have 7-day weeks
    return 7
  }

  daysInMonth(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): number {
    needReceiver(Calendar, this)
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return getImpl(this).daysInMonth(fields.year, fields.month)
  }

  daysInYear(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): number {
    needReceiver(Calendar, this)
    const fields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return computeDaysInYear(getImpl(this), fields.year)
  }

  monthsInYear(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): number {
    needReceiver(Calendar, this)
    const calFields = queryDateFields(arg, this, true) // disallowMonthDay=true
    return getImpl(this).monthsInYear(calFields.year)
  }

  inLeapYear(
    arg:
    | Temporal.PlainDate
    | Temporal.PlainDateTime
    | Temporal.PlainYearMonth
    | Temporal.PlainDateLike
    | string,
  ): boolean {
    needReceiver(Calendar, this)
    return getImpl(this).inLeapYear(this.year(arg))
  }

  dateFromFields(
    fields: Temporal.YearOrEraAndEraYear & Temporal.MonthOrMonthCode & { day: number },
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainDate {
    needReceiver(Calendar, this)

    const isIso = getImpl(this).id === 'iso8601'
    const refinedFields = refineFields(
      fields,
      isIso ? dateFieldMap : allDateFieldMap,
      isIso ? { year: true, day: true } : {},
    )
    const isoFields = queryDateISOFields(refinedFields, getImpl(this), options)

    return new PlainDate(
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
      this,
    )
  }

  yearMonthFromFields(
    fields: Temporal.YearOrEraAndEraYear & Temporal.MonthOrMonthCode,
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainYearMonth {
    needReceiver(Calendar, this)

    const isIso = getImpl(this).id === 'iso8601'
    const refinedFields = refineFields(
      fields,
      isIso ? yearMonthFieldMap : allYearMonthFieldMap,
      isIso ? { year: true } : {},
    )
    const isoFields = queryDateISOFields({ ...refinedFields, day: 1 }, getImpl(this), options)

    return new PlainYearMonth(
      isoFields.isoYear,
      isoFields.isoMonth,
      this,
      isoFields.isoDay,
    )
  }

  monthDayFromFields(
    fields: Temporal.MonthCodeOrMonthAndYear & { day: number },
    options?: Temporal.AssignmentOptions,
  ): Temporal.PlainMonthDay {
    needReceiver(Calendar, this)

    const impl = getImpl(this)
    const isIso = getImpl(this).id === 'iso8601'
    let { era, eraYear, year, month, monthCode, day } = refineFields(
      fields,
      isIso ? monthDayFieldMap : allMonthDayFieldMap,
      isIso ? { day: true } : {},
    ) as any // HACK for era/eraYear

    if (day === undefined) {
      throw new TypeError('required property \'day\' missing or undefined')
    }

    if (monthCode !== undefined) {
      year = isoEpochLeapYear
    } else if (era !== undefined && eraYear !== undefined) {
      year = convertEraYear(impl.id, eraYear, era)
    }

    if (year === undefined) {
      if (monthCode !== undefined) {
        year = impl.guessYearForMonthDay(monthCode, day)
      } else {
        throw new TypeError('either year or monthCode required with month')
      }
    }

    const isoFields = queryDateISOFields(
      { year, month: month!, monthCode: monthCode!, day }, // HACKs!
      impl,
      options,
    )

    return new PlainMonthDay(
      isoFields.isoMonth,
      isoFields.isoDay,
      this,
      impl.normalizeISOYearForMonthDay(isoFields.isoYear),
    )
  }

  dateAdd(
    dateArg: PlainDateArg,
    durationArg: DurationArg,
    options?: Temporal.ArithmeticOptions,
  ): Temporal.PlainDate {
    needReceiver(Calendar, this)

    const impl = getImpl(this)
    const date = ensureObj(PlainDate, dateArg)
    const duration = ensureObj(Duration, durationArg)
    const overflowHandling = parseOverflowOption(options)

    // TODO: make less verbose. ALSO, cache cal dates in WeakMap for use by non-iso calImpl
    const isoFields = getExistingDateISOFields(date, true) // disallowMonthDay=true
    const calFields = isoToEpochNanoSafe(
      getImpl(this),
      isoFields.isoYear,
      isoFields.isoMonth,
      isoFields.isoDay,
    )
    const translatedIsoFields = translateDate(calFields, duration, impl, overflowHandling)

    return new PlainDate(
      translatedIsoFields.isoYear,
      translatedIsoFields.isoMonth,
      translatedIsoFields.isoDay,
      this,
    )
  }

  dateUntil(
    dateArg0: PlainDateArg,
    dateArg1: PlainDateArg,
    options?: Temporal.DifferenceOptions<'year' | 'month' | 'week' | 'day'>,
  ): Temporal.Duration {
    needReceiver(Calendar, this)

    const impl = getImpl(this)
    const d0 = ensureObj(PlainDate, dateArg0)
    const d1 = ensureObj(PlainDate, dateArg1)
    const largestUnitStr = ensureOptionsObj(options).largestUnit
    const largestUnit = largestUnitStr === 'auto'
      ? DAY // TODO: util for this?
      : parseUnit<DateUnitInt>(largestUnitStr, DAY, DAY, YEAR)

    // TODO: make less verbose. ALSO, cache cal dates in WeakMap for use by non-iso calImpl
    const isoFields0 = getExistingDateISOFields(d0, true) // disallowMonthDay=true
    const calFields0 = isoToEpochNanoSafe(
      getImpl(this),
      isoFields0.isoYear,
      isoFields0.isoMonth,
      isoFields0.isoDay,
    )
    const isoFields1 = getExistingDateISOFields(d1, true) // disallowMonthDay=true
    const calFields1 = isoToEpochNanoSafe(
      getImpl(this),
      isoFields1.isoYear,
      isoFields1.isoMonth,
      isoFields1.isoDay,
    )

    return createDuration(
      diffDateFields(calFields0, calFields1, impl, largestUnit),
    )
  }

  /*
  Given a date-type's core field names, returns the field names that should be
  given to Calendar::yearMonthFromFields/monthDayFromFields/dateFromFields
  */
  fields(inFields: string[]): string[] {
    needReceiver(Calendar, this)

    const outFields: string[] = []
    const outFieldMap: any = {}

    for (const fieldName of inFields) { // inField could be iterator! TODO: adjust type
      if (typeof fieldName !== 'string') {
        throw new TypeError('Field must be string')
      }
      if (!(fieldName in dateTimeFieldMap)) {
        throw new RangeError('Invalid field')
      }
      if (outFieldMap[fieldName]) {
        throw new RangeError('Cannot have duplicate field')
      }
      outFieldMap[fieldName] = true
      outFields.push(fieldName)
    }

    if (this.toString() !== 'iso8601' && outFields.indexOf('year') !== -1) {
      outFields.push('era', 'eraYear')
    }

    return outFields
  }

  /*
  Given a date-instance, and fields to override, returns the fields that should be
  given to Calendar::yearMonthFromFields/monthDayFromFields/dateFromFields
  */
  // TODO: use Record<string, unknown>
  mergeFields(baseFields: any, additionalFields: any): any {
    needReceiver(Calendar, this)
    if (
      baseFields == null ||
      additionalFields == null
    ) {
      throw new TypeError('Both arguments must be coercible into objects')
    }
    return mergeCalFields(baseFields, additionalFields, getImpl(this).id)
  }

  toString(): string {
    needReceiver(Calendar, this)
    return getImpl(this).id
  }
}

// mixins
export interface Calendar extends JsonMethods {}
mixinJsonMethods(Calendar)
//
export interface Calendar { [Symbol.toStringTag]: 'Temporal.Calendar' }
attachStringTag(Calendar, 'Calendar')

export function createDefaultCalendar(): Calendar {
  return new Calendar(isoCalendarID)
}

export function calendarFrom(arg: Temporal.CalendarLike): Temporal.CalendarProtocol {
  if (isObjectLike(arg)) {
    if (arg instanceof Calendar) {
      return arg as any
    }
    const secretCalendar =
      getZonedDateTimeInterals(arg as any)?.calendar ||
      getISOFields(arg as any)?.calendar
    if (secretCalendar) {
      return secretCalendar
    }
    if (arg instanceof TimeZone) {
      throw new RangeError('Expected a calendar object but received a Temporal.TimeZone')
    }
    if (!('calendar' in arg)) {
      return arg
    } else {
      arg = arg.calendar

      if (arg instanceof TimeZone) {
        throw new RangeError('Expected a calendar object but received a Temporal.TimeZone')
      }
      if (isObjectLike(arg) && !('calendar' in arg)) {
        return arg as any
      }
    }
  }

  // parse as string...
  const strVal = toString(arg)
  const parsed = tryParseDateTime(strVal, false, true) // allowZ=true
  return new Calendar(
    parsed // a date-time string?
      ? parsed.calendar || isoCalendarID
      : strVal, // any other type of string
  )
}

export function mergeCalFields(baseFields: any, newFields: any, calendarID: string): any {
  const baseFieldsCopy = { ...baseFields }
  const newFieldsCopy = { ...newFields }

  if (
    newFieldsCopy.month !== undefined ||
    newFieldsCopy.monthCode !== undefined
  ) {
    delete baseFieldsCopy.month
    delete baseFieldsCopy.monthCode
  }

  if (
    calendarID !== 'iso8601' && (
      newFieldsCopy.era !== undefined ||
      newFieldsCopy.eraYear !== undefined ||
      newFieldsCopy.year !== undefined
    )
  ) {
    delete baseFieldsCopy.era
    delete baseFieldsCopy.eraYear
    delete baseFieldsCopy.year
  }

  if (
    calendarID === 'japanese' && ( // erasBeginMidYear?
      newFieldsCopy.day !== undefined ||
      newFieldsCopy.monthCode !== undefined ||
      newFieldsCopy.month !== undefined
    )
  ) {
    delete baseFieldsCopy.era
    delete baseFieldsCopy.eraYear
  }

  return Object.assign(Object.create(null), baseFieldsCopy, newFieldsCopy)
}

// utils

// TODO: can we eliminate this now that it's checked in public date classes?
function isoToEpochNanoSafe(
  calendarImpl: CalendarImpl,
  isoYear: number,
  isoMonth: number,
  isoDay: number,
): CalendarImplFields {
  const epochMilli = isoToEpochMilli(isoYear, isoMonth, isoDay)
  checkEpochMilliBuggy(epochMilli, calendarImpl.id)
  return calendarImpl.computeFields(epochMilli)
}
