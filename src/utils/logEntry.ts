export function logEntry(params: { severity: string; message: string }) {
    console.log(JSON.stringify(params))
}
