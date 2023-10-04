import * as functions from "firebase-functions"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateAllRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`0 1 1,16 * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`all`)
        await updateEachPeriodsRanking.run()
    })
