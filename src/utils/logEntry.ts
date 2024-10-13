type Severity = `ALERT` | `DEBUG` | `ERROR` | `INFO` | `WARNING`

export function logEntry(params: { message: string; severity: Severity }) {
  console.log(JSON.stringify(params))
}
