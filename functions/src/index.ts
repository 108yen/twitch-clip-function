import * as admin from "firebase-admin"

// Firebase Admin SDK の初期化
// https://firebase.google.com/docs/functions/config-env?hl=ja
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    })
}

//deploy function
import { updateAllRanking } from "./firebase-functions/clip/updateAllRanking"
import { updateEachPeriodsRanking } from "./firebase-functions/clip/updateEachPeriodsRanking"
import { updatePastRanking } from "./firebase-functions/clip/updatePastRanking"
import { streamerSelection } from "./firebase-functions/streamer/streamerSelection"

export {
    streamerSelection,
    updateEachPeriodsRanking,
    updatePastRanking,
    updateAllRanking
}
