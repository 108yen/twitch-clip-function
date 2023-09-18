import * as functions from "firebase-functions"

import { GetYearRankingFunctionLogic } from "./getYearRankingFunctionLogic"

//get twitch clip ranking for each year
export const getYearRankingFunction = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 300,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`0 1 4 * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const getYearRankingFunctionLogic = await GetYearRankingFunctionLogic.init()

        const streamers = await getYearRankingFunctionLogic.getStreamers()
        await getYearRankingFunctionLogic.getClipForEeachStreamers(streamers)
    })
