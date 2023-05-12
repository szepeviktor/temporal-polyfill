import { toIntegerThrowOnInfinity, toPositiveInteger } from './cast'
import { isoTimeFieldDefaults, isoTimeFieldNames } from './isoFields'
import { mapProps, remapProps } from './obj'

// does NOT contain era/eraYear (considered special-case for certain calendars)

export const yearMonthFieldRefiners = {
  // sorted alphabetically
  month: toPositiveInteger,
  monthCode: toString,
  year: toIntegerThrowOnInfinity,
}

export const dateFieldRefiners = {
  // sorted alphabetically
  day: toPositiveInteger,
  ...yearMonthFieldRefiners,
}

export const monthDayFieldRefiners = {
  // sorted alphabetically
  day: toPositiveInteger, // not DRY
  monthCode: toString, // not DRY
}

export const timeFieldRefiners = {
  // sorted alphabetically
  hour: toIntegerThrowOnInfinity,
  microsecond: toIntegerThrowOnInfinity,
  millisecond: toIntegerThrowOnInfinity,
  minute: toIntegerThrowOnInfinity,
  nanosecond: toIntegerThrowOnInfinity,
  second: toIntegerThrowOnInfinity,
}

export const dateTimeFieldRefiners = {
  // keys must be resorted
  ...dateFieldRefiners,
  ...timeFieldRefiners,
}

export const yearStatRefiners = {
  // sorted alphabetically, for predictable macros
  daysInYear: toPositiveInteger,
  inLeapYear: toPositiveInteger,
  monthsInYear: toPositiveInteger,
}
export const yearStatNames = Object.keys(yearStatRefiners)

export const yearMonthStatRefiners = {
  ...yearStatRefiners,
  daysInMonth: toPositiveInteger,
}

export const dateStatRefiners = {
  ...yearMonthStatRefiners,
  dayOfWeek: toPositiveInteger,
  dayOfYear: toPositiveInteger,
  weekOfYear: toPositiveInteger,
  yearOfWeek: toPositiveInteger,
  daysInWeek: toPositiveInteger,
}

//
// NOTE: "basic" names are for converting between Plain* objects. Don't need all numeric fields
//
export const dateFieldNames = Object.keys(dateFieldRefiners)
export const dateFieldBasics = ['day', 'month', 'year']
export const yearMonthFieldNames = Object.keys(yearMonthFieldRefiners) // month/monthCode/year
export const yearMonthBasicNames = yearMonthFieldNames.slice(1) // monthCode/year
export const monthDayFieldNames = dateFieldNames.slice(0, 3) // day/month/monthCode
export const monthDayBasicNames = ['day', 'monthCode']
export const monthFieldNames = monthDayFieldNames.slice(1) // month/monthCode
export const dateTimeFieldNames = Object.keys(dateTimeFieldRefiners).sort()
export const timeFieldNames = Object.keys(timeFieldRefiners)

export const eraYearFieldNames = ['era', 'eraYear']
export const allYearFieldNames = [...eraYearFieldNames, 'year']

export const yearMonthGetters = createCalendarGetters({
  ...yearMonthFieldRefiners,
  ...yearMonthStatRefiners,
})

export const monthDayGetters = createCalendarGetters(monthDayFieldRefiners)

export const dateCalendarRefiners = {
  ...dateFieldRefiners,
  ...dateStatRefiners,
}

export const dateGetters = createCalendarGetters(dateCalendarRefiners)

export const timeGetters = isoTimeFieldNames.reduce((accum, isoTimeField, i) => {
  accum[timeFieldNames[i]] = function(internals) {
    return internals[isoTimeField]
  }
  return accum
}, {}) // TODO: somehow leverage remapProps instead?

export const dateTimeGetters = {
  ...dateGetters,
  ...timeGetters,
}

function createCalendarGetters(refiners) {
  const getters = mapProps(refiners, (refiner, fieldName) => {
    return function(internals) {
      return refiner(internals.calendar[fieldName](this))
    }
  })

  getters.calendarId = function(internals) {
    return internals.calendar.id
  }

  return getters
}

export function timeFieldsToIso(timeFields) {
  return remapProps(timeFields, timeFieldNames, isoTimeFieldNames)
}

export const timeFieldDefaults = remapProps(isoTimeFieldDefaults, isoTimeFieldNames, timeFieldNames)
