import * as functions from "firebase-functions"

import { UpdatePastRankingLogic } from "./updatePastRankingLogic"

//get twitch clip ranking for each year
export const updatePastRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 300,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`0 1 4 * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updatePastRankingLogic = await UpdatePastRankingLogic.init()

        const streamers = await updatePastRankingLogic.getStreamers()
        await updatePastRankingLogic.getClipForEeachStreamers(streamers)
    })
