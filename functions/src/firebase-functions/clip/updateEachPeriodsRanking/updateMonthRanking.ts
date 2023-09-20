import * as functions from "firebase-functions"
import { UpdateOnePeriodRanking } from "./updateEachPeriodsRanking"

export const updateMonthRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`20 0,6,12,18 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRanking = new UpdateOnePeriodRanking("month", 30)
        await updateEachPeriodsRanking.run()
    })
