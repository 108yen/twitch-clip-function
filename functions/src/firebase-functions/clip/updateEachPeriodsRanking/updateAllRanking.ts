import * as functions from "firebase-functions"
import { UpdateOnePeriodRanking } from "./logic/UpdateOnePeriodRanking"

export const updateAllRanking = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`0 1 1,16 * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const updateEachPeriodsRanking = new UpdateOnePeriodRanking("all")
        await updateEachPeriodsRanking.run()
    })
