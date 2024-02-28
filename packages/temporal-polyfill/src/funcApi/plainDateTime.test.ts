import { describe, expect, it } from 'vitest'
import * as DurationFns from './duration'
import * as PlainDateTimeFns from './plainDateTime'
import {
  expectDurationEquals,
  expectPlainDateEquals,
  expectPlainDateTimeEquals,
  expectPlainMonthDayEquals,
  expectPlainTimeEquals,
  expectPlainYearMonthEquals,
  expectZonedDateTimeEquals,
} from './testUtils'

describe('create', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.create(
      2024,
      1,
      1,
      12,
      30,
      0,
      0,
      0,
      1,
      'hebrew',
    )
    expectPlainDateTimeEquals(pdt, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
      isoNanosecond: 1,
    })
  })
})

describe('fromString', () => {
  it('works', () => {
    const pd = PlainDateTimeFns.fromString('2024-01-01T12:30:00[u-ca=hebrew]')
    expectPlainDateTimeEquals(pd, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('fromFields', () => {
  it('works without options', () => {
    const pdt = PlainDateTimeFns.fromFields({
      calendar: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
      hour: 12,
      minute: 30,
    })
    expectPlainDateTimeEquals(pdt, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('getFields', () => {
  it('works with calendar with eras', () => {
    const pdt = PlainDateTimeFns.fromString('2024-01-01T12:30:00[u-ca=gregory]')
    expect(PlainDateTimeFns.getFields(pdt)).toEqual({
      era: 'ce',
      eraYear: 2024,
      year: 2024,
      month: 1,
      monthCode: 'M01',
      day: 1,
      hour: 12,
      minute: 30,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0,
    })
  })
})

describe('withFields', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromFields({
      calendar: 'hebrew',
      year: 5784,
      month: 4,
      day: 20,
      hour: 11,
    })
    const pdt1 = PlainDateTimeFns.withFields(pdt0, {
      year: 5600,
      month: 3,
      hour: 12,
      nanosecond: 5,
    })
    const fields1 = PlainDateTimeFns.getFields(pdt1)
    expect(fields1).toEqual({
      era: undefined,
      eraYear: undefined,
      year: 5600,
      month: 3,
      monthCode: 'M03',
      day: 20,
      hour: 12,
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 5,
    })
  })
})

describe('withCalendar', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.fromString('2024-01-01T12:30:00[u-ca=hebrew]')
    const pdt1 = PlainDateTimeFns.withCalendar(pdt0, 'gregory')
    expectPlainDateTimeEquals(pdt1, {
      calendar: 'gregory',
      isoYear: 2024,
      isoMonth: 1,
      isoDay: 1,
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('dayOfWeek', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.dayOfWeek(pdt)).toBe(2)
  })
})

describe('daysInWeek', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.daysInWeek(pdt)).toBe(7)
  })
})

describe('weekOfYear', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.weekOfYear(pdt)).toBe(undefined)
  })

  it('returns correct gregory results', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00[u-ca=gregory]')
    expect(PlainDateTimeFns.weekOfYear(pdt)).toBe(1)
  })

  it('returns correct iso8601 results', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00')
    expect(PlainDateTimeFns.weekOfYear(pdt)).toBe(52)
  })
})

describe('yearOfWeek', () => {
  it('returns undefined for calendars without defined weeks', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.yearOfWeek(pdt)).toBe(undefined)
  })

  it('returns correct gregory results', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00[u-ca=gregory]')
    expect(PlainDateTimeFns.yearOfWeek(pdt)).toBe(2023)
  })

  it('returns correct iso8601 results', () => {
    const pdt = PlainDateTimeFns.fromString('2023-01-01T12:30:00')
    expect(PlainDateTimeFns.yearOfWeek(pdt)).toBe(2022)
  })
})

describe('dayOfYear', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expect(PlainDateTimeFns.dayOfYear(pdt)).toBe(58)
  })
})

describe('daysInMonth', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expect(PlainDateTimeFns.daysInMonth(pdt)).toBe(29)
  })
})

describe('daysInYear', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    expect(PlainDateTimeFns.daysInYear(pdt)).toBe(366)
  })
})

describe('monthsInYear', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.monthsInYear(pdt)).toBe(13)
  })
})

describe('inLeapYear', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    expect(PlainDateTimeFns.inLeapYear(pdt)).toBe(true)
  })
})

describe('add', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.create(2024, 2, 27, 12, 30)
    const pdt1 = PlainDateTimeFns.add(
      pdt0,
      DurationFns.create(1, 1, 0, 0, 4, 5),
    )
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2025,
      isoMonth: 3,
      isoDay: 27,
      isoHour: 16,
      isoMinute: 35,
    })
  })
})

describe('subtract', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.create(2024, 2, 27, 12, 30)
    const pdt1 = PlainDateTimeFns.subtract(
      pdt0,
      DurationFns.create(1, 1, 0, 0, 4, 5),
    )
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2023,
      isoMonth: 1,
      isoDay: 27,
      isoHour: 8,
      isoMinute: 25,
    })
  })
})

describe('until', () => {
  it('works with no options', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12)
    const d = PlainDateTimeFns.until(pdt0, pdt1)
    expectDurationEquals(d, {
      days: 398,
      hours: 2,
    })
  })

  it('works with options', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12)
    const d = PlainDateTimeFns.until(pdt0, pdt1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: 1,
      months: 1,
      days: 2,
      hours: 2,
    })
  })
})

describe('since', () => {
  it('works with no options', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12)
    const d = PlainDateTimeFns.since(pdt0, pdt1)
    expectDurationEquals(d, {
      days: -398,
      hours: -2,
    })
  })

  it('works with options', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12)
    const d = PlainDateTimeFns.since(pdt0, pdt1, { largestUnit: 'year' })
    expectDurationEquals(d, {
      years: -1,
      months: -1,
      days: -2,
      hours: -2,
    })
  })
})

describe('round', () => {
  it('works with single unit arg', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 12)
    const pdt1 = PlainDateTimeFns.round(pdt0, 'day')
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2023,
      isoMonth: 1,
      isoDay: 26,
    })
  })

  it('works with options arg', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 12)
    const pdt1 = PlainDateTimeFns.round(pdt0, {
      smallestUnit: 'day',
    })
    expectPlainDateTimeEquals(pdt1, {
      isoYear: 2023,
      isoMonth: 1,
      isoDay: 26,
    })
  })
})

describe('equals', () => {
  it('works affirmatively', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10, 30)
    const pdt1 = PlainDateTimeFns.create(2024, 1, 25, 12, 45)
    expect(PlainDateTimeFns.equals(pdt0, pdt1)).toBe(false)
  })

  it('works negatively', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10, 30)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12, 45)
    expect(PlainDateTimeFns.equals(pdt0, pdt1)).toBe(false)
  })
})

describe('compare', () => {
  it('works', () => {
    const pdt0 = PlainDateTimeFns.create(2023, 1, 25, 10, 30)
    const pdt1 = PlainDateTimeFns.create(2024, 2, 27, 12, 45)
    expect(PlainDateTimeFns.compare(pdt0, pdt1)).toBe(-1)
    expect(PlainDateTimeFns.compare(pdt1, pdt0)).toBe(1)
    expect(PlainDateTimeFns.compare(pdt0, pdt0)).toBe(0)
  })
})

describe('toZonedDateTime', () => {
  it('works without disambiguation options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    const zdt = PlainDateTimeFns.toZonedDateTime(pdt, 'America/New_York')
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })

  it('works with disambiguation options', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    const zdt = PlainDateTimeFns.toZonedDateTime(pdt, 'America/New_York', {
      disambiguation: 'later',
    })
    expectZonedDateTimeEquals(zdt, {
      calendar: 'hebrew',
      timeZone: 'America/New_York',
      epochNanoseconds: 1709055000000000000n,
    })
  })
})

describe('toPlainDate', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00[u-ca=hebrew]')
    const pd = PlainDateTimeFns.toPlainDate(pdt)
    expectPlainDateEquals(pd, {
      calendar: 'hebrew',
      isoYear: 2024,
      isoMonth: 2,
      isoDay: 27,
    })
  })
})

describe('toPlainYearMonth', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    const pym = PlainDateTimeFns.toPlainYearMonth(pdt)
    expectPlainYearMonthEquals(pym, {
      isoYear: 2024,
      isoMonth: 2,
    })
  })
})

describe('toPlainMonthDay', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    const pmd = PlainDateTimeFns.toPlainMonthDay(pdt)
    expectPlainMonthDayEquals(pmd, {
      isoMonth: 2,
      isoDay: 27,
    })
  })
})

describe('toPlainTime', () => {
  it('works', () => {
    const pdt = PlainDateTimeFns.fromString('2024-02-27T12:30:00')
    const pt = PlainDateTimeFns.toPlainTime(pdt)
    expectPlainTimeEquals(pt, {
      isoHour: 12,
      isoMinute: 30,
    })
  })
})

describe('toString', () => {
  it('works without options', () => {
    const pdt = PlainDateTimeFns.create(2024, 2, 27, 12, 30)
    const s = PlainDateTimeFns.toString(pdt)
    expect(s).toBe('2024-02-27T12:30:00')
  })

  it('works with options', () => {
    const pdt = PlainDateTimeFns.create(2024, 2, 27, 12, 30)
    const s = PlainDateTimeFns.toString(pdt, {
      calendarName: 'always',
      fractionalSecondDigits: 2,
    })
    expect(s).toBe('2024-02-27T12:30:00.00[u-ca=iso8601]')
  })
})
