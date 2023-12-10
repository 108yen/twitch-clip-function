export function getJSTDate() {
    const jstFormatter = new Intl.DateTimeFormat(`ja-JP`, { timeZone: `Asia/Tokyo` })
    const jstTime = jstFormatter.format(new Date())
    return new Date(jstTime)
}
