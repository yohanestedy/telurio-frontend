import dayjs from 'dayjs'
import { getCurrentLanguage } from './i18n'

const weekdayShortLabelsId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const
const weekdayLongLabelsId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const
const weekdayShortLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const weekdayLongLabelsEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

function locale() {
  return getCurrentLanguage() === 'id' ? 'id-ID' : 'en-US'
}

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
  const labels = getCurrentLanguage() === 'id' ? weekdayShortLabelsId : weekdayShortLabelsEn
  return labels[dayjs(value).day()]
}

export function weekdayLongLabelId(value: string | Date) {
  const labels = getCurrentLanguage() === 'id' ? weekdayLongLabelsId : weekdayLongLabelsEn
  return labels[dayjs(value).day()]
}

export function formatDayMonthId(value: string | Date) {
  return new Intl.DateTimeFormat(locale(), {
    day: '2-digit',
    month: 'short',
  }).format(toDate(value))
}

export function formatDayMonthYearId(value: string | Date) {
  return new Intl.DateTimeFormat(locale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(toDate(value))
}

export function formatWeekdayDayMonthYearId(value: string | Date) {
  return new Intl.DateTimeFormat(locale(), {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(toDate(value))
}

export function formatMonthYearId(value: string | Date) {
  return new Intl.DateTimeFormat(locale(), {
    month: 'long',
    year: 'numeric',
  }).format(toDate(value))
}
