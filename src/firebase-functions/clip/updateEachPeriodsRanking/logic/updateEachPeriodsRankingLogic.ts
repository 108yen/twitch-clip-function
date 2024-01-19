import { TwitchClipApi } from "../../../../apis/clip"
import { Streamer } from "../../../../models/streamer"
import { ClipFunction } from "../../clipFunction"

import dayjs from "@/utils/dayjs"

type Periods = { [key: string]: { started_at?: dayjs.Dayjs; ended_at?: dayjs.Dayjs } }

export class UpdateEachPeriodsRankingLogic extends ClipFunction {
    period: string
    day?: number

    constructor(twitchClipApi: TwitchClipApi, period: string, day?: number) {
        super(twitchClipApi, `summary`)

        this.period = period
        this.day = day
    }

    public static async init(period: string, day?: number) {
        const twitchClipApi = await this.getTwitchClipApi()
        return new UpdateEachPeriodsRankingLogic(twitchClipApi, period, day)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getPeriods(streamer: Streamer): Periods {
        const today = dayjs()
        let periods: Periods
        if (this.day) {
            const daysAgo = today.subtract(this.day, `day`)
            periods = {
                [this.period]: { started_at: daysAgo, ended_at: today }
            }
        } else {
            periods = {
                [this.period]: {}
            }
        }
        return periods
    }
}
