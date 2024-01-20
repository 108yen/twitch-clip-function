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
import { updateAllRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateAllRanking"
import { updateDayRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateDayRanking"
import { updateMonthRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateMonthRanking"
import { updateWeekRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateWeekRanking"
import { updateYearRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateYearRanking"
import { updatePastRanking } from "./firebase-functions/clip/updatePastRanking"
import { streamerSelection } from "./firebase-functions/streamer/streamerSelection"
import { tweetTopClip } from "./firebase-functions/twitter/tweet"
import dayjs from "./utils/dayjs"
import { logEntry } from "./utils/logEntry"

async function main() {
    const startedAt = dayjs()
    const hour = startedAt.tz().hour()

    logEntry({ severity: `INFO`, message: `started at ${startedAt.format()}` })

    // 6時間ごと
    if ([0, 6, 12, 18].includes(hour)) {
        await streamerSelection()
    }

    // 3時間ごと
    await updateDayRanking()

    // 毎日0時
    if (hour == 0) {
        await updateWeekRanking()
        await updateMonthRanking()
        await updateYearRanking()

        //tweet
        await tweetTopClip()
    }

    // 毎月1日に1だけ実行
    if (startedAt.date() == 1 && hour == 0) {
        await updatePastRanking()
        await updateAllRanking()
    }

    const endedAt = dayjs()
    const executionTime = endedAt.diff(startedAt)
    const formattedDiff = dayjs.duration(executionTime).format(`HH時間 mm分 ss.SSS秒`)

    logEntry({
        severity: `INFO`,
        message: `ended at ${endedAt.format()}, execution time ${formattedDiff}`
    })
}

main()
