import * as functions from "firebase-functions"

import { UpdateDailyRankingLogic } from "./logic/updateDailyRankingLogic"
import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateDayRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`0 0-23/3 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(
            `day`,
            1
        )
        const clipDoc = await updateEachPeriodsRanking.run()
        const updateDailyRankingLogic = new UpdateDailyRankingLogic(clipDoc)
        await updateDailyRankingLogic.update()
    })
