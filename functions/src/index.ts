import * as admin from "firebase-admin";

// Firebase Admin SDK の初期化
// https://firebase.google.com/docs/functions/config-env?hl=ja
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    })
}

//deploy function
import { streamerSelection } from "./firebase-functions/streamer/streamerSelection";
import { getTwitchClipFunction } from "./firebase-functions/clip/getTwitchClipFunction";
import { getYearRankingFunction } from "./firebase-functions/clip/getYearRankingFunction";
import { getTwitchClipForAllRankingFunction } from "./firebase-functions/clip/getTwitchClipForAllRankingFunction";

export {
    streamerSelection,
    getTwitchClipFunction,
    getYearRankingFunction,
    getTwitchClipForAllRankingFunction,
}