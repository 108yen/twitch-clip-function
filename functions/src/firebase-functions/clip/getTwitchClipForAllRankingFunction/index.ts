import * as functions from "firebase-functions"

import { GetTwitchClipForAllRankingFunctionLogic } from "./getTwitchClipForAllRankingFunctionLogic"

//get twitch clip every month 1st and 16 for all ranking
export const getTwitchClipForAllRankingFunction = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 300,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`0 1 1,16 * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const getTwitchClipForAllRankingFunctionLogic =
            await GetTwitchClipForAllRankingFunctionLogic.init()

        const streamers =
            await getTwitchClipForAllRankingFunctionLogic.getStreamers()
        await getTwitchClipForAllRankingFunctionLogic.getClipForEeachStreamers(
            streamers
        )
    })
