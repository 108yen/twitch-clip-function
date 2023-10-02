import { TwitchClipApi } from "../../../../apis/clip"
import { Streamer } from "../../../../models/streamer"
import { ClipFunction } from "../../clipFunction"

type Periods = { [key: string]: { started_at?: Date; ended_at?: Date } }

export class UpdateEachPeriodsRankingLogic extends ClipFunction {
    periods: Periods

    constructor(twitchClipApi: TwitchClipApi, periods: Periods) {
        super(twitchClipApi, `summary`)
        this.periods = periods
    }

    public static async init(periods: Periods) {
        const twitchClipApi = await this.getTwitchClipApi()
        return new UpdateEachPeriodsRankingLogic(twitchClipApi, periods)
    }

    getPeriods(streamer: Streamer): Periods {
        return this.periods
    }
}
