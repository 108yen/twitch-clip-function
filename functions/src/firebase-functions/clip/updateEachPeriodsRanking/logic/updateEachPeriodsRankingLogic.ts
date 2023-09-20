import { TwitchClipApi } from "../../../../apis/clip"
import { Clip } from "../../../../models/clip"
import { ClipDoc } from "../../../../models/clipDoc"
import { Streamer } from "../../../../models/streamer"
import { ClipFunction } from "../../clipFunction"

type Periods = { [key: string]: { started_at?: Date; ended_at?: Date } }

export class UpdateEachPeriodsRankingLogic extends ClipFunction {
    periods: Periods

    constructor(twitchClipApi: TwitchClipApi, periods: Periods) {
        super(twitchClipApi)
        this.periods = periods
    }

    public static async init(periods: Periods) {
        const twitchClipApi = await this.getTwitchClipApi()
        return new UpdateEachPeriodsRankingLogic(twitchClipApi, periods)
    }

    async getClipForEeachStreamers(streamers: Array<Streamer>) {
        const summary = new ClipDoc()
        for (const key in streamers) {
            if (Object.prototype.hasOwnProperty.call(streamers, key)) {
                const streamer = streamers[key]
                const clipDoc = await this.getClipDoc(streamer.id)
                clipDoc.sort()

                //push to firestore
                this.clipRepository.batchUpdateClip(
                    streamer.id,
                    clipDoc,
                    await this.batchRepository.getBatch()
                )
                summary.clipDocConcat(clipDoc)
            }
        }
        summary.sort()

        //push to firestore
        this.clipRepository.batchUpdateClip(
            `summary`,
            summary,
            await this.batchRepository.getBatch()
        )
        await this.batchRepository.commitBatch()
    }

    private async getClipDoc(streamerId: string): Promise<ClipDoc> {
        const clipDoc = new ClipDoc()
        for (const key in this.periods) {
            if (Object.prototype.hasOwnProperty.call(this.periods, key)) {
                const period = this.periods[key]
                const clips = await this.getClips(period, streamerId)
                clipDoc.clipsMap.set(key, clips)
            }
        }

        return clipDoc
    }

    private async getClips(
        period: { started_at?: Date; ended_at?: Date },
        streamerId: string
    ): Promise<Array<Clip>> {
        const clips = await this.twitchClipApi.getClips(
            parseInt(streamerId),
            period.started_at,
            period.ended_at
        )
        return clips
    }
}
