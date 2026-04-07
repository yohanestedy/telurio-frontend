import type { ZodError, ZodIssue } from 'zod'

function joinPath(path: ZodIssue['path']) {
  return path
    .map((segment) => String(segment))
    .join('.')
}

export function mapZodErrors(error: ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = joinPath(issue.path)
    acc[key] = issue.message
    return acc
  }, {})
}
