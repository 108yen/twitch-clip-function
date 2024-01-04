export function formatTime(milliseconds: number) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    return `${hours}hours ${minutes % 60}minutes ${seconds % 60}seconds`
}

export function formatDate(date: Date) {
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
    return formattedDate
}

// export function getJSTHours() {
//     const date = new Date()
//     const hour = date.getUTCHours()
//     return hour + 9 < 24 ? hour + 9 : hour - 15
// }

// export function getJSTDate() {
//     const date = new Date()
//     const time = date.getTime()
//     return new Date(time + 9 * 60 * 60 * 1000)
// }

export function getJSTHours() {
    return getJSTDate().getHours()
}

export function getJSTDate() {
    return utcToJst(new Date())
}

function utcToJst(date: Date) {
    const jstFormatter = new Intl.DateTimeFormat(`ja-JP`, { timeZone: `Asia/Tokyo` })
    const jstTime = jstFormatter.format(date)
    return new Date(jstTime)
}
