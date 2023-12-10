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
// import { updateAllRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateAllRanking"
// import { updateDayRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateDayRanking"
// import { updateMonthRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateMonthRanking"
// import { updateWeekRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateWeekRanking"
// import { updateYearRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateYearRanking"
// import { updatePastRanking } from "./firebase-functions/clip/updatePastRanking"
// import { streamerSelection } from "./firebase-functions/streamer/streamerSelection"
import { formatDate, formatTime, getJSTHours } from "./utils/formatTime"
import { logEntry } from "./utils/logEntry"

async function main() {
    const startedAt = new Date()
    const jstHours = getJSTHours()

    logEntry({ severity: `INFO`, message: `started at ${formatDate(startedAt)}` })
    logEntry({ severity: `INFO`, message: `debug hours ${jstHours}` })

    // // 6時間ごと
    // if ([0, 6, 12, 18].includes(jstHours)) {
    //     await streamerSelection()
    // }

    // // 3時間ごと
    // await updateDayRanking()
    // await updateWeekRanking()
    // await updateMonthRanking()
    // await updateYearRanking()

    // // 毎月1日に1だけ実行
    // if (startedAt.getDate() == 1 && jstHours == 0) {
    //     await updatePastRanking()
    //     await updateAllRanking()
    // }

    const endedAt = new Date()
    const executionTime = endedAt.getTime() - startedAt.getTime()

    logEntry({
        severity: `INFO`,
        message: `ended at ${formatDate(endedAt)}, execution time ${formatTime(
            executionTime
        )}`
    })
}

main()
