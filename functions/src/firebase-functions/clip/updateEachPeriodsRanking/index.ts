import * as functions from "firebase-functions"
import { UpdateEachPeriodsRankingLogic } from "./updateEachPeriodsRankingLogic"

//get twitch clip every day
export const updateEachPeriodsRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`0 0,6,12,18 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRankingLogic =
            await UpdateEachPeriodsRankingLogic.init()

        const streamers = await updateEachPeriodsRankingLogic.getStreamers()
        await updateEachPeriodsRankingLogic.getClipForEeachStreamers(streamers)
    })
