import { TwitchClipApi } from "../../../../apis/clip"
import { ClipDoc } from "../../../../models/clipDoc"
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

    async getClipDoc(streamer: Streamer): Promise<ClipDoc | undefined> {
        const clipDoc = new ClipDoc()
        for (const key in this.periods) {
            if (Object.prototype.hasOwnProperty.call(this.periods, key)) {
                const period = this.periods[key]
                const clips = await this.getClips(period, streamer.id)
                const addStreamerinfoClip = this.addStreamerinfoToClips(clips, streamer)

                clipDoc.clipsMap.set(key, addStreamerinfoClip)
            }
        }

        return clipDoc
    }
}
