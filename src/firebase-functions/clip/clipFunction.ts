import { TwitchClipApi } from "../../apis/clip"
import { Clip } from "../../models/clip"
import { ClipDoc } from "../../models/clipDoc"
import { Streamer } from "../../models/streamer"
import { BatchRepository } from "../../repositories/batch"
import { ClipRepository } from "../../repositories/clip"
import { StreamerRepository } from "../../repositories/streamer"
import { logEntry } from "../../utils/logEntry"

import dayjs from "@/utils/dayjs"

type Periods = { [key: string]: { started_at?: dayjs.Dayjs; ended_at?: dayjs.Dayjs } }

export abstract class ClipFunction {
    protected streamerRepository = new StreamerRepository()
    protected clipRepository = new ClipRepository()
    protected batchRepository = new BatchRepository(10)
    protected twitchClipApi: TwitchClipApi
    protected summaryType: `summary` | `past_summary`

    constructor(twitchClipApi: TwitchClipApi, summaryType: `summary` | `past_summary`) {
        this.twitchClipApi = twitchClipApi
        this.summaryType = summaryType
    }

    protected static async getTwitchClipApi() {
        const twitchClipApi = await TwitchClipApi.init(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            process.env.TWITCH_CLIENT_ID!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            process.env.TWITCH_CLIENT_SECRET!
        )
        return twitchClipApi
    }

    async run() {
        const streamers = await this.getStreamers()
        return await this.getClipForEeachStreamers(streamers)
    }

    protected async getStreamers(): Promise<Array<Streamer>> {
        return await this.streamerRepository.getStreamers()
    }

    private async getClipForEeachStreamers(streamers: Array<Streamer>) {
        //for summary ranking
        const summary = new ClipDoc()
        //get for each streamer's clips
        for (const streamer of streamers) {
            const clipDoc = await this.getClipDoc(streamer)
            if (clipDoc) {
                clipDoc.sort()
                this.clipRepository.batchUpdateClip(
                    streamer.id,
                    clipDoc,
                    await this.batchRepository.getBatch()
                )

                summary.clipDocConcat(clipDoc)
                summary.sort()
            }
        }
        //post summary clips to firestore
        this.clipRepository.batchUpdateClip(
            this.summaryType,
            summary,
            await this.batchRepository.getBatch()
        )
        await this.batchRepository.commitBatch()

        return summary
    }

    // have to defined get clip's periods
    abstract getPeriods(streamer: Streamer): Periods

    private async getClipDoc(streamer: Streamer): Promise<ClipDoc | undefined> {
        const periods = this.getPeriods(streamer)
        const clipDoc = new ClipDoc()
        for (const key in periods) {
            if (Object.prototype.hasOwnProperty.call(periods, key)) {
                const period = periods[key]
                const clips = await this.getClips(period, streamer.id)
                if (clips.length != 0) {
                    const addStreamerinfoClip = this.addStreamerinfoToClips(
                        clips,
                        streamer
                    )

                    clipDoc.clipsMap.set(key, addStreamerinfoClip)
                } else {
                    logEntry({
                        severity: `DEBUG`,
                        message: `update clip info: ${streamer.display_name}: has no ${key} clips`
                    })
                }
            }
        }
        if (clipDoc.clipsMap.size == 0) {
            return
        }

        return clipDoc
    }

    protected async getClips(
        period: { started_at?: dayjs.Dayjs; ended_at?: dayjs.Dayjs },
        streamerId: string
    ): Promise<Array<Clip>> {
        const clips = await this.twitchClipApi.getClips(
            parseInt(streamerId),
            period.started_at,
            period.ended_at
        )
        return clips
    }

    protected addStreamerinfoToClips(clips: Array<Clip>, streamer: Streamer) {
        const result: Array<Clip> = []
        for (const clip of clips) {
            const addStreamerinfoClip = new Clip({
                ...clip,
                profile_image_url: streamer.profile_image_url,
                broadcaster_follower_num: streamer.follower_num,
                broadcaster_login: streamer.login
            })
            result.push(addStreamerinfoClip)
        }

        return result
    }
}
