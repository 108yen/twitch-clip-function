import { TwitchClipApi } from "../../apis/clip"
import { Clip } from "../../models/clip"
import { ClipDoc } from "../../models/clipDoc"
import { Streamer } from "../../models/streamer"
import { BatchRepository } from "../../repositories/batch"
import { ClipRepository } from "../../repositories/clip"
import { StreamerRepository } from "../../repositories/streamer"
import dayjs from "../../utils/dayjs"
import { logEntry } from "../../utils/logEntry"

type Periods = Record<
  string,
  { ended_at?: dayjs.Dayjs; started_at?: dayjs.Dayjs }
>

export abstract class ClipFunction {
  protected batchRepository = new BatchRepository(10)
  protected clipRepository = new ClipRepository()
  protected streamerRepository = new StreamerRepository()
  protected summaryType: `past_summary` | `summary`
  protected twitchClipApi: TwitchClipApi

  constructor(
    twitchClipApi: TwitchClipApi,
    summaryType: `past_summary` | `summary`,
  ) {
    this.twitchClipApi = twitchClipApi
    this.summaryType = summaryType
  }

  protected static async getTwitchClipApi() {
    const twitchClipApi = await TwitchClipApi.init(
      process.env.TWITCH_CLIENT_ID!,

      process.env.TWITCH_CLIENT_SECRET!,
    )
    return twitchClipApi
  }

  protected addStreamerInfoToClips(clips: Array<Clip>, streamer: Streamer) {
    const result: Array<Clip> = []

    for (const clip of clips) {
      const addStreamerInfoClip = new Clip({
        ...clip,
        broadcaster_follower_num: streamer.follower_num,
        broadcaster_login: streamer.login,
        profile_image_url: streamer.profile_image_url,
      })

      result.push(addStreamerInfoClip)
    }

    return result
  }

  protected async getClips(
    period: { ended_at?: dayjs.Dayjs; started_at?: dayjs.Dayjs },
    streamerId: string,
  ): Promise<Array<Clip>> {
    const clips = await this.twitchClipApi.getClips(
      parseInt(streamerId),
      period.started_at,
      period.ended_at,
    )

    return clips
  }

  protected async getStreamers(): Promise<Array<Streamer>> {
    return await this.streamerRepository.getStreamers()
  }

  private async getClipDoc(streamer: Streamer): Promise<ClipDoc | undefined> {
    const periods = this.getPeriods(streamer)
    const clipDoc = new ClipDoc()

    for (const key in periods) {
      if (Object.prototype.hasOwnProperty.call(periods, key)) {
        const period = periods[key]

        let clips: Clip[]
        try {
          clips = await this.getClips(period, streamer.id)
        } catch (error) {
          logEntry({
            message: `Failed to get ${streamer.display_name}'s ${key} clips by twitch api. Error message: ${error}`,
            severity: "ERROR",
          })

          continue
        }

        const addStreamerInfoClip = this.addStreamerInfoToClips(clips, streamer)
        clipDoc.clipsMap.set(key, addStreamerInfoClip)

        if (clips.length == 0) {
          logEntry({
            message: `update clip info: ${streamer.display_name}: has no ${key} clips`,
            severity: "DEBUG",
          })
        }
      }
    }

    if (clipDoc.clipsMap.size == 0) {
      return
    }

    return clipDoc
  }

  private async getClipForEachStreamers(streamers: Array<Streamer>) {
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
          await this.batchRepository.getBatch(),
        )

        summary.clipDocConcat(clipDoc)
        summary.sort()
      }
    }
    //post summary clips to firestore
    this.clipRepository.batchUpdateClip(
      this.summaryType,
      summary,
      await this.batchRepository.getBatch(),
    )
    await this.batchRepository.commitBatch()

    return summary
  }

  // have to defined get clip's periods
  abstract getPeriods(streamer: Streamer): Periods

  async run() {
    const streamers = await this.getStreamers()
    return await this.getClipForEachStreamers(streamers)
  }
}
