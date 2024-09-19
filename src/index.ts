import * as admin from "firebase-admin"

// Firebase Admin SDK の初期化
// https://firebase.google.com/docs/functions/config-env?hl=ja
// importより前に実行する必要がある
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    })
}

//deploy function
import {
    updateAllRanking,
    updateDayRanking,
    updateMonthRanking,
    updateWeekRanking,
    updateYearRanking,
    updatePastRanking,
    streamerSelection,
    tweetTopClip,
    revalidate
} from "./firebase-functions"
import dayjs from "./utils/dayjs"
import { logEntry } from "./utils/logEntry"

async function main() {
    const startedAt = dayjs()
    const hour = startedAt.tz().hour()

    logEntry({ severity: `INFO`, message: `started at ${startedAt.tz().format()}` })

    // every 3 hours
    await updateDayRanking()

    // every 6 hours
    if ([0, 6, 12, 18].includes(hour)) {
        await streamerSelection()
    }

    // everyday at 0 o'clock
    if (hour == 0) {
        await updateWeekRanking()
        await updateMonthRanking()
        await updateYearRanking()

        //tweet
        await tweetTopClip()
    }

    // every month at 1st
    if (startedAt.date() == 1 && hour == 0) {
        await updatePastRanking()
        await updateAllRanking()
    }

    // revalidate page cache
    await revalidate()

    const endedAt = dayjs()
    const executionTime = endedAt.diff(startedAt)
    const formattedDiff = dayjs.duration(executionTime).format(`HH時間 mm分 ss.SSS秒`)

    logEntry({
        severity: `INFO`,
        message: `ended at ${endedAt.tz().format()}, execution time ${formattedDiff}`
    })
}

main()
