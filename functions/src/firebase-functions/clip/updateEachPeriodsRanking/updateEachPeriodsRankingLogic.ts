import { Clip } from "../../../models/clip"
import { ClipDoc } from "../../../models/clipDoc"
import { Streamer } from "../../../models/streamer"
import { ClipFunction } from "../clipFunction"

export class UpdateEachPeriodsRankingLogic extends ClipFunction {
    periods: { [key: string]: number } = {
        day: 1,
        week: 7,
        month: 30,
        year: 365
    }

    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi()
        return new UpdateEachPeriodsRankingLogic(twitchClipApi)
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
        period: number,
        streamerId: string
    ): Promise<Array<Clip>> {
        const now = new Date() // get present date
        const daysAgo = new Date(now.getTime() - period * 24 * 60 * 60 * 1000) //days ago
        const clips = await this.twitchClipApi.getClips(
            parseInt(streamerId),
            daysAgo,
            now
        )
        return clips
    }
}
