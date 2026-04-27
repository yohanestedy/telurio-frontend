import type { CalendarDay } from './domain'
import type { AppIconName } from '../utils/icons'

export type CalendarOrder = CalendarDay['events']['orders'][number]

export type CalendarOrderActionId =
  | 'start-delivery'
  | 'edit-allocation'
  | 'complete-delivery'
  | 'payment-update'
  | 'open-detail'

export interface CalendarOrderAction {
  id: CalendarOrderActionId
  label: string
  icon: AppIconName
  variant: 'primary' | 'secondary' | 'ghost'
  prominent?: boolean
  iconOnly?: boolean
}
