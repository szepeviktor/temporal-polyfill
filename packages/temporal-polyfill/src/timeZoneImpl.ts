import { isoCalendarId } from './calendarConfig'
import { parseIntlYear } from './calendarImpl'
import { OrigDateTimeFormat, hashIntlFormatParts, standardLocaleId } from './intlFormat'
import { IsoDateTimeFields } from './isoFields'
import {
  epochNanoToSec,
  epochNanoToSecMod,
  epochSecToNano,
  isoArgsToEpochSec,
  isoToEpochNano,
  isoToEpochSec,
} from './isoMath'
import { parseOffsetNano } from './isoParse'
import { LargeInt } from './largeInt'
import { TimeZoneOps } from './timeZoneOps'
import { milliInSec, nanoInSec, secInDay } from './units'
import { clamp, compareNumbers, createLazyGenerator } from './utils'

const periodDur = secInDay * 60
const minPossibleTransition = isoArgsToEpochSec(1847)
const maxPossibleTransition = isoArgsToEpochSec(new Date().getUTCFullYear() + 10)

const queryIntlTimeZoneImpl = createLazyGenerator((timeZoneId: string) => {
  return new IntlTimeZoneImpl(timeZoneId)
})

export function queryTimeZoneImpl(timeZoneId: string): TimeZoneImpl {
  const offsetNano = parseOffsetNano(timeZoneId)

  if (offsetNano !== undefined) {
    return new FixedTimeZoneImpl(timeZoneId, offsetNano)
  }

  return queryIntlTimeZoneImpl(timeZoneId)
}

export interface TimeZoneImpl extends TimeZoneOps {
  getTransition(epochNano: LargeInt, direction: -1 | 1): LargeInt | undefined
}

// Fixed
// -------------------------------------------------------------------------------------------------

export class FixedTimeZoneImpl implements TimeZoneImpl {
  constructor(
    public id: string,
    public offsetNano: number,
  ) {}

  getOffsetNanosecondsFor(epochNano: LargeInt): number {
    return this.offsetNano
  }

  getPossibleInstantsFor(isoDateTimeFields: IsoDateTimeFields): LargeInt[] {
    return [isoToEpochNano(isoDateTimeFields)!.addNumber(this.offsetNano)]
  }

  getTransition(epochNano: LargeInt, direction: -1 | 1): LargeInt | undefined {
    return undefined // hopefully minifier will remove
  }
}

// Intl
// -------------------------------------------------------------------------------------------------

interface IntlTimeZoneStore {
  getPossibleEpochSec: (zonedEpochSec: number) => number[]
  getOffsetSec: (epochSec: number) => number
  getTransition: (epochSec: number, direction: -1 | 1) => number | undefined
}

export class IntlTimeZoneImpl implements TimeZoneImpl {
  store: IntlTimeZoneStore

  constructor(
    public id: string
  ) {
    this.store = createIntlTimeZoneStore(createComputeOffsetSec(id))
  }

  getOffsetNanosecondsFor(epochNano: LargeInt): number {
    return this.store.getOffsetSec(epochNanoToSec(epochNano)) * nanoInSec
  }

  getPossibleInstantsFor(isoDateTimeFields: IsoDateTimeFields): LargeInt[] {
    const [zonedEpochSec, subsecNano] = isoToEpochSec(isoDateTimeFields)

    return this.store.getPossibleEpochSec(zonedEpochSec)
      .map((epochSec) => epochSecToNano(epochSec).addNumber(subsecNano))
  }

  /*
  exclusive for both directions
  */
  getTransition(epochNano: LargeInt, direction: -1 | 1): LargeInt | undefined {
    const [epochSec, subsecNano] = epochNanoToSecMod(epochNano)
    const resEpochSec = this.store.getTransition(
      epochSec.toNumber() + ((direction > 0 || subsecNano) ? 1 : 0),
      direction,
    )
    if (resEpochSec !== undefined) {
      return epochSecToNano(resEpochSec)
    }
  }
}

function createIntlTimeZoneStore(
  computeOffsetSec: (epochSec: number) => number,
): IntlTimeZoneStore {
  const getSample = createLazyGenerator(computeOffsetSec) // always given startEpochSec/endEpochSec
  const getSplit = createLazyGenerator(createSplitTuple)
  let minTransition = minPossibleTransition
  let maxTransition = maxPossibleTransition

  function getPossibleEpochSec(zonedEpochSec: number): number[] {
    let startOffsetSec = getOffsetSec(zonedEpochSec - secInDay)
    let endOffsetSec = getOffsetSec(zonedEpochSec + secInDay)
    const startUtcEpochSec = zonedEpochSec - startOffsetSec

    if (startOffsetSec === endOffsetSec) {
      return [startUtcEpochSec]
    }

    const endUtcEpochSec = zonedEpochSec - endOffsetSec
    startOffsetSec = getOffsetSec(startUtcEpochSec)
    endOffsetSec = getOffsetSec(endUtcEpochSec)

    if (startOffsetSec === endOffsetSec) {
      return [startUtcEpochSec]
    }

    if (startUtcEpochSec < endUtcEpochSec) {
      return [startUtcEpochSec, endUtcEpochSec]
    }

    return []
  }

  function getOffsetSec(epochSec: number): number {
    const clampedEpochSec = clamp(epochSec, minTransition, maxTransition)
    const [startEpochSec, endEpochSec] = computePeriod(clampedEpochSec)
    const startOffsetSec = getSample(startEpochSec)
    const endOffsetSec = getSample(endEpochSec)

    if (startOffsetSec === endOffsetSec) {
      return startOffsetSec
    }

    const split = getSplit(startEpochSec, endEpochSec)
    return pinch(split, startOffsetSec, endOffsetSec, epochSec)
  }

  /*
  inclusive for positive direction, exclusive for negative
  */
  function getTransition(epochSec: number, direction: -1 | 1): number | undefined {
    const clampedEpochSec = clamp(epochSec, minTransition, maxTransition)
    let [startEpochSec, endEpochSec] = computePeriod(clampedEpochSec)

    const inc = periodDur * direction
    const inBounds = direction < 0
      ? () => endEpochSec > minTransition || (minTransition = clampedEpochSec, false)
      : () => startEpochSec < maxTransition || (maxTransition = clampedEpochSec, false)

    while (inBounds()) {
      const startOffsetSec = getSample(startEpochSec)
      const endOffsetSec = getSample(endEpochSec)

      if (startOffsetSec !== endOffsetSec) {
        const split = getSplit(startEpochSec, endEpochSec)
        pinch(split, startOffsetSec, endOffsetSec)
        const transitionEpochSec = split[0]

        if ((compareNumbers(epochSec, transitionEpochSec) || 1) === direction) {
          return transitionEpochSec
        }
      }

      startEpochSec += inc
      endEpochSec += inc
    }
  }

  /*
  everything outside of 'split' is know that transition doesn't happen
  transition is the first reading of a new offset period
  just one isolated sample doesn't make it known
  */
  function pinch(
    split: [number, number],
    startOffsetSec: number,
    endOffsetSec: number,
  ): undefined
  function pinch(
    split: [number, number],
    startOffsetSec: number,
    endOffsetSec: number,
    forEpochSec: number,
  ): number
  function pinch(
    split: [number, number],
    startOffsetSec: number,
    endOffsetSec: number,
    forEpochSec?: number,
  ): number | undefined {
    let offsetSec: number | undefined
    let splitDurSec: number | undefined

    while (
      (forEpochSec === undefined ||
        (offsetSec = (
          forEpochSec < split[0]
            ? startOffsetSec
            : forEpochSec >= split[1]
              ? endOffsetSec
              : undefined
        )) === undefined
      ) &&
      (splitDurSec = split[1] - split[0])
    ) {
      const middleEpochSec = split[0] + Math.floor(splitDurSec / 2)
      const middleOffsetSec = computeOffsetSec(middleEpochSec)

      if (middleOffsetSec === endOffsetSec) {
        split[1] = middleEpochSec
      } else { // middleOffsetSec === startOffsetSec
        split[0] = middleEpochSec + 1
      }
    }

    return offsetSec
  }

  return { getPossibleEpochSec, getOffsetSec, getTransition }
}

function createSplitTuple(startEpochSec: number, endEpochSec: number): [number, number] {
  return [startEpochSec, endEpochSec]
}

function computePeriod(epochSec: number): [number, number] {
  const startEpochSec = Math.floor(epochSec / periodDur)
  const endEpochSec = startEpochSec + periodDur
  return [startEpochSec, endEpochSec]
}

function createComputeOffsetSec(timeZoneId: string): (
  (epochSec: number) => number
) {
  const format = buildIntlFormat(timeZoneId)

  return (epochSec: number) => {
    const intlParts = hashIntlFormatParts(format, epochSec * milliInSec)
    const zonedEpochSec = isoArgsToEpochSec(
      parseIntlYear(intlParts, isoCalendarId).year,
      parseInt(intlParts.month),
      parseInt(intlParts.day),
      parseInt(intlParts.hour),
      parseInt(intlParts.minute),
      parseInt(intlParts.second),
    )
    return zonedEpochSec - epochSec
  }
}

function buildIntlFormat(timeZoneId: string): Intl.DateTimeFormat {
  // format will ALWAYS do gregorian. need to parse year
  return new OrigDateTimeFormat(standardLocaleId, {
    timeZone: timeZoneId,
    era: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
}
