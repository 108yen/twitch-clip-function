import { UpdateEachPeriodsRankingLogic } from "./updateEachPeriodsRankingLogic"

export class UpdateOnePeriodRanking {
    periods: { [key: string]: { started_at?: Date; ended_at?: Date } }

    constructor(period: string, day?: number) {
        const today = new Date()
        if (day) {
            const daysAgo = new Date(
                today.getTime() - day * 24 * 60 * 60 * 1000
            )
            this.periods = {
                [period]: { started_at: daysAgo, ended_at: today }
            }
        } else {
            this.periods = {
                [period]: {}
            }
        }
    }

    async run() {
        const updateEachPeriodsRankingLogic =
            await UpdateEachPeriodsRankingLogic.init(this.periods)
        const streamers = await updateEachPeriodsRankingLogic.getStreamers()
        await updateEachPeriodsRankingLogic.getClipForEeachStreamers(streamers)
    }
}
