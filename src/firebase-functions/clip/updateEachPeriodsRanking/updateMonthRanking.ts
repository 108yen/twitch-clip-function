import * as functions from "firebase-functions"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateMonthRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`20 0-23/3 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(
            `month`,
            30
        )
        await updateEachPeriodsRanking.run()
    })
