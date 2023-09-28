import * as functions from "firebase-functions"

import { UpdateOnePeriodRanking } from "./logic/UpdateOnePeriodRanking"

export const updateYearRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`30 0,6,12,18 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRanking = new UpdateOnePeriodRanking(`year`, 365)
        await updateEachPeriodsRanking.run()
    })
