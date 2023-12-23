import assert from "assert"

import { Streamer } from "../../../models/streamer"
import { getJSTDate } from "../../../utils/formatTime"
import { ClipFunction } from "../clipFunction"

type Periods = { [key: string]: { started_at?: Date; ended_at?: Date } }

export class UpdatePastRankingLogic extends ClipFunction {
    private past_limit = 5 //max 5 years ago

    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi()
        return new UpdatePastRankingLogic(twitchClipApi, `past_summary`)
    }

    //5年以上前のランキングの削除処理を別で入れる
    private async deleteFieldVal(clipId: string, key: string) {
        this.clipRepository.batchDeleteFieldValue(
            clipId,
            key,
            await this.batchRepository.getBatch()
        )
    }

    async deleteOverLimitYear() {
        const streamers = await this.getStreamers()
        const current_year = new Date().getFullYear()
        const limit_year = current_year - this.past_limit

        for (const streamer of streamers) {
            assert(
                typeof streamer.created_at === `string`,
                new Error(
                    `GetYearRankingFunctionLogic/getClipDoc: ${streamer.display_name}: created_at is not string`
                )
            )
            const created_at = new Date(streamer.created_at)
            if (created_at.getFullYear() < limit_year) {
                for (let year = created_at.getFullYear(); year < limit_year; year++) {
                    await this.deleteFieldVal(streamer.id, year.toString())
                }
            }
        }
        //todo: check past_summary

        await this.batchRepository.commitBatch()
    }

    getPeriods(streamer: Streamer): Periods {
        assert(
            typeof streamer.created_at === `string`,
            new Error(
                `GetYearRankingFunctionLogic/getClipDoc: ${streamer.display_name}: created_at is not string`
            )
        )
        const created_at = new Date(streamer.created_at)
        const periods: Periods = {}

        const current_year = getJSTDate().getFullYear()
        if (created_at.getFullYear() == current_year) {
            console.info(`${streamer.display_name}: account created at this year`)
            return periods
        }
        const start_year =
            created_at.getFullYear() < current_year - this.past_limit
                ? current_year - this.past_limit
                : created_at.getFullYear()

        for (let year = start_year; year < current_year; year++) {
            //UTC指定なので-9時間
            const started_at = new Date(year - 1, 11, 31, 15, 0, 0)
            const ended_at = new Date(year, 11, 31, 14, 59, 59)
            periods[`${year}`] = { started_at: started_at, ended_at: ended_at }
        }
        return periods
    }
}
