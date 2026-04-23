import dayjs from 'dayjs'

const weekdayShortLabelsId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const
const weekdayLongLabelsId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

const dayMonthFormatterId = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
})

const dayMonthYearFormatterId = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const monthYearFormatterId = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
})

function toDate(value: string | Date) {
  return dayjs(value).toDate()
}

export function startOfWeekMonday(value: string | Date) {
  const cursor = dayjs(value)
  const dayIndex = cursor.day()
  const offset = dayIndex === 0 ? 6 : dayIndex - 1

  return cursor.subtract(offset, 'day').startOf('day')
}

export function endOfWeekMonday(value: string | Date) {
  return startOfWeekMonday(value).add(6, 'day').endOf('day')
}

export function weekdayShortLabelId(value: string | Date) {
  return weekdayShortLabelsId[dayjs(value).day()]
}

export function weekdayLongLabelId(value: string | Date) {
  return weekdayLongLabelsId[dayjs(value).day()]
}

export function formatDayMonthId(value: string | Date) {
  return dayMonthFormatterId.format(toDate(value))
}

export function formatDayMonthYearId(value: string | Date) {
  return dayMonthYearFormatterId.format(toDate(value))
}

export function formatMonthYearId(value: string | Date) {
  return monthYearFormatterId.format(toDate(value))
}
