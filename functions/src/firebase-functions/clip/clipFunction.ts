/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TwitchClipApi } from "../../apis/clip"
import { Clip } from "../../models/clip"
import { ClipDoc } from "../../models/clipDoc"
import { Streamer } from "../../models/streamer"
import { BatchRepository } from "../../repositories/batch"
import { ClipRepository } from "../../repositories/clip"
import { StreamerRepository } from "../../repositories/streamer"

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
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        )
        return twitchClipApi
    }

    async getStreamers(): Promise<Array<Streamer>> {
        return await this.streamerRepository.getStreamers()
    }

    async getClipForEeachStreamers(streamers: Array<Streamer>) {
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
    }

    abstract getClipDoc(streamer: Streamer): Promise<ClipDoc | undefined>

    protected async getClips(
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
