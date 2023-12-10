import * as functions from "firebase-functions"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateWeekRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`10 0-23/3 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(
            `week`,
            7
        )
        await updateEachPeriodsRanking.run()
    })
