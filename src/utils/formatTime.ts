export function formatTime(milliseconds: number) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    return `${hours}hours ${minutes % 60}minutes ${seconds % 60}seconds`
}

export function getJSTHours() {
    return getJSTDate().getUTCHours()
}

export function getJSTDate() {
    return setJSTDateInUTCDate(new Date())
}

function setJSTDateInUTCDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: `Asia/Tokyo`,
        year: `numeric`,
        month: `2-digit`,
        day: `2-digit`,
        hour: `2-digit`,
        minute: `2-digit`,
        second: `2-digit`
    }

    const formattedDate = new Intl.DateTimeFormat(`ja-JP`, options).format(date)

    //utcに無理やりJST時間をセットする
    return new Date(Date.parse(`${formattedDate}Z`))
}
