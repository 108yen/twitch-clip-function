import * as functions from "firebase-functions"

import { UpdateOnePeriodRanking } from "./logic/updateOnePeriodRanking"

export const updateDayRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`0 0,6,12,18 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRanking = new UpdateOnePeriodRanking(`day`, 1)
        await updateEachPeriodsRanking.run()
    })
