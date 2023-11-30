import { calendarImplDateAdd, calendarImplDateFromFields, calendarImplDateUntil, calendarImplDay, calendarImplDaysInMonth, calendarImplFields, calendarImplMergeFields, calendarImplMonthDayFromFields, calendarImplYearMonthFromFields, createCalendarImplRecord } from '../internal/calendarRecordSimple'
import { createTimeZoneImplRecord, timeZoneImplGetOffsetNanosecondsFor, timeZoneImplGetPossibleInstantsFor } from '../internal/timeZoneRecordSimple'

export function getDateModCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

export function getMoveCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
  })
}

export function getDiffCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
  })
}

export function createTypicalTimeZoneRecordIMPL(timeZoneSlot: string) {
  return createTimeZoneImplRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
    getPossibleInstantsFor: timeZoneImplGetPossibleInstantsFor,
  })
}

export function createSimpleTimeZoneRecordIMPL(timeZoneSlot: string) {
  return createTimeZoneImplRecord(timeZoneSlot, {
    getOffsetNanosecondsFor: timeZoneImplGetOffsetNanosecondsFor,
  })
}

export function createYearMonthNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
  })
}

export function createYearMonthModCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    yearMonthFromFields: calendarImplYearMonthFromFields,
    fields: calendarImplFields,
    mergeFields: calendarImplMergeFields,
  })
}

export function createYearMonthMoveCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    daysInMonth: calendarImplDaysInMonth,
    day: calendarImplDay,
  })
}

export function createYearMonthDiffCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateAdd: calendarImplDateAdd,
    dateUntil: calendarImplDateUntil,
    day: calendarImplDay,
  })
}

export function createMonthDayNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    monthDayFromFields: calendarImplMonthDayFromFields,
    fields: calendarImplFields,
  })
}

export function createDateNewCalendarRecordIMPL(calendarId: string) {
  return createCalendarImplRecord(calendarId, {
    dateFromFields: calendarImplDateFromFields,
    fields: calendarImplFields,
  })
}
