export function logEntry(params: { severrity: string; message: string }) {
    console.log(
        JSON.stringify(params)
    )
}
