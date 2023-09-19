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

        const today = new Date()
        function daysAgo(day: number) {
            const today = new Date()
            return new Date(today.getTime() - day * 24 * 60 * 60 * 1000)
        }
        const periods = {
            day: { started_at: daysAgo(1), ended_at: today },
            week: { started_at: daysAgo(7), ended_at: today },
            month: { started_at: daysAgo(30), ended_at: today },
            year: { started_at: daysAgo(365), ended_at: today }
        }

        const updateEachPeriodsRankingLogic =
            await UpdateEachPeriodsRankingLogic.init(periods)

        const streamers = await updateEachPeriodsRankingLogic.getStreamers()
        await updateEachPeriodsRankingLogic.getClipForEeachStreamers(streamers)
    })
