export function formatTime(milliseconds: number) {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    return `${hours}hours ${minutes % 60}minutes ${seconds % 60}seconds`
}
