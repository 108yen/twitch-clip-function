/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TwitchClipApi } from "../../apis/clip"
import { Clip } from "../../models/clip"
import { Streamer } from "../../models/streamer"
import { BatchRepository } from "../../repositories/batch"
import { ClipRepository } from "../../repositories/clip"
import { StreamerRepository } from "../../repositories/streamer"

export abstract class ClipFunction {
    protected streamerRepository = new StreamerRepository()
    protected clipRepository = new ClipRepository()
    protected batchRepository = new BatchRepository(10)
    protected twitchClipApi: TwitchClipApi
    constructor(twitchClipApi: TwitchClipApi) {
        this.twitchClipApi = twitchClipApi
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
                profile_image_url: streamer.profile_image_url
            })
            result.push(addStreamerinfoClip)
        }

        return result
    }

    abstract getClipForEeachStreamers(streamers: Array<Streamer>): Promise<void>
}
