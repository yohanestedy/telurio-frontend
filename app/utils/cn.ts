type ClassValue =
  | string
  | undefined
  | null
  | false
  | Record<string, boolean>
  | ClassValue[]

function flatten(value: ClassValue): string[] {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(flatten)
  }

  return Object.entries(value)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.flatMap(flatten).join(' ')
}
