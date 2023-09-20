import * as admin from "firebase-admin"

// Firebase Admin SDK の初期化
// https://firebase.google.com/docs/functions/config-env?hl=ja
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    })
}

//deploy function
import { updateAllRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateAllRanking"
import { updatePastRanking } from "./firebase-functions/clip/updatePastRanking"
import { streamerSelection } from "./firebase-functions/streamer/streamerSelection"
import { updateDayRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateDayRanking"
import { updateMonthRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateMonthRanking"
import { updateWeekRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateWeekRanking"
import { updateYearRanking } from "./firebase-functions/clip/updateEachPeriodsRanking/updateYearRanking"

export {
    streamerSelection,
    updateDayRanking,
    updateWeekRanking,
    updateMonthRanking,
    updateYearRanking,
    updateAllRanking,
    updatePastRanking
}
