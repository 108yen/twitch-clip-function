import assert from "assert"

import * as functions from "firebase-functions"

import { Streamer } from "../../../models/streamer"
import { ClipFunction } from "../clipFunction"

type Periods = { [key: string]: { started_at?: Date; ended_at?: Date } }

export class UpdatePastRankingLogic extends ClipFunction {
    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi()
        return new UpdatePastRankingLogic(twitchClipApi, `past_summary`)
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

        const start_year =
            created_at.getFullYear() < 2016 ? 2016 : created_at.getFullYear()
        const current_year = new Date().getFullYear()
        if (start_year == current_year) {
            functions.logger.info(
                `${streamer.display_name}: account created at this year`
            )
            return periods
        }

        for (let year = start_year; year < current_year; year++) {
            const started_at = new Date(year, 0, 1, 0, 0, 0)
            const ended_at = new Date(year, 11, 31, 23, 59, 59)
            periods[`${year}`] = { started_at: started_at, ended_at: ended_at }
        }
        return periods
    }
}
