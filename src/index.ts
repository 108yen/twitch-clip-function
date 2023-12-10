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

async function main() {
    // jstのDate取得
    const jstFormatter = new Intl.DateTimeFormat(`ja-JP`, { timeZone: `Asia/Tokyo` })
    const jstTime = jstFormatter.format(new Date())
    const currentDate = new Date(jstTime)

    // 6時間ごと
    if ([0, 6, 12, 18].includes(currentDate.getHours())) {
        await streamerSelection()
    }

    // 3時間ごと
    await updateDayRanking()
    await updateWeekRanking()
    await updateMonthRanking()
    await updateYearRanking()

    // 毎月1日に1だけ実行
    if (currentDate.getDate() == 1 && currentDate.getHours() == 0) {
        await updatePastRanking()
        await updateAllRanking()
    }
}

main()
