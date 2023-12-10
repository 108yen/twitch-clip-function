type Severity = `DEBUG` | `INFO` | `WARNING` | `ERROR` | `ALERT`

export function logEntry(params: { severity: Severity; message: string; }) {
    console.log(JSON.stringify(params))
}
