import { BatchRepository } from "../../..//repositories/batch"
import { TwitchStreamerApi } from "../../../apis/streamer"
import { BLACKLIST } from "../../../constant"
import { ClipDoc } from "../../../models/clipDoc"
import { Stream } from "../../../models/stream"
import { Streamer } from "../../../models/streamer"
import { Team } from "../../../models/team"
import { ClipRepository } from "../../../repositories/clip"
import { StreamerRepository } from "../../../repositories/streamer"
import { logEntry } from "../../../utils/logEntry"

export class StreamerSelectionLogic {
  private batchRepository = new BatchRepository()
  private clipRepository = new ClipRepository()
  private streamerRepository = new StreamerRepository()
  private twitchStreamerApi: TwitchStreamerApi
  STREAMER_NUM_LIMIT = 300
  constructor(twitchStreamerApi: TwitchStreamerApi) {
    this.twitchStreamerApi = twitchStreamerApi
  }

  public static async init() {
    const twitchStreamerApi = await TwitchStreamerApi.init(
      process.env.TWITCH_CLIENT_ID!,
      process.env.TWITCH_CLIENT_SECRET!,
    )
    return new StreamerSelectionLogic(twitchStreamerApi)
  }

  private sortByFollowerNum(streamers: Array<Streamer>) {
    return streamers.sort((a, b) => {
      if (b.follower_num == undefined) {
        return -1
      }
      if (a.follower_num == undefined) {
        return 1
      }
      return b.follower_num - a.follower_num
    })
  }

  private async storeFollowers(
    ids: Array<string>,
    twitchStreamerApi: TwitchStreamerApi,
  ): Promise<Array<Streamer>> {
    const streamers: Array<Streamer> = []

    for (const id of ids) {
      let follower_num: number | undefined

      try {
        //get follower num from twitch api
        follower_num = await twitchStreamerApi.getFollowerNum(id)
      } catch {
        logEntry({
          message: `Failed get ${id} follower from twitch.`,
          severity: "ERROR",
        })
      }

      streamers.push(
        new Streamer({
          follower_num,
          id: id,
        }),
      )
    }

    return streamers
  }

  concatAndFilter(
    oldStreamers: Array<Streamer>,
    newStreamers: Array<Streamer>,
  ) {
    //Select streamers with top STREAMER_NUM_LIMIT
    const sumStreamers = this.sortByFollowerNum(
      oldStreamers.concat(newStreamers),
    )

    const selectedStreamers = sumStreamers
      .filter(({ id }) => !BLACKLIST.IDs.includes(id))
      .slice(0, this.STREAMER_NUM_LIMIT)
    const selectedStreamerIds = selectedStreamers.map((e) => e.id)

    const newStreamerIds = newStreamers.map((e) => e.id)
    const removedStreamerIds = sumStreamers
      .map((e) => e.id)
      .filter(
        (id) =>
          !selectedStreamerIds.includes(id) && !newStreamerIds.includes(id),
      )

    const addedStreamerIds = selectedStreamerIds.filter((id) =>
      newStreamerIds.includes(id),
    )

    return { addedStreamerIds, removedStreamerIds, selectedStreamers }
  }

  filterStreams(
    streams: Array<Stream>,
    oldStreamerIds: Array<string>,
  ): Array<string> {
    const filteredId = streams
      .filter(({ tags, user_id, viewer_count }) => {
        if (viewer_count == undefined || user_id == undefined) {
          return false
        }
        //remove by tag or id
        if (tags?.some((tag) => BLACKLIST.Tags.includes(tag))) {
          return false
        }
        if (BLACKLIST.IDs.includes(user_id)) {
          return false
        }
        //remove less than 500 views live
        if (viewer_count < 500) {
          return false
        }
        //remove already exist ids
        if (oldStreamerIds.includes(user_id)) {
          return false
        }

        return true
      })
      .map((e) => e.user_id) as Array<string>

    //remove duplicate
    const newStreamerIds: Array<string> = filteredId.filter(
      (id, index) => filteredId.indexOf(id) === index,
    )
    return newStreamerIds
  }

  async getJpLiveStreaming(): Promise<Array<Stream>> {
    try {
      const streams = await this.twitchStreamerApi.getJpStreams()
      return streams
    } catch {
      logEntry({
        message: "Failed get streams from twitch.",
        severity: "ERROR",
      })

      return []
    }
  }

  async getNewStreamerFollower(
    newStreamerIds: Array<string>,
  ): Promise<Array<Streamer>> {
    const newStreamers = await this.storeFollowers(
      newStreamerIds,
      this.twitchStreamerApi,
    )
    return newStreamers
  }

  async getOldStreamer(): Promise<{
    oldStreamerIds: Array<string>
    oldStreamers: Array<Streamer>
  }> {
    const fetchStreamers = await this.streamerRepository.getStreamers()
    const oldStreamerIds = fetchStreamers.map((streamer) => streamer.id)
    const oldStreamers = await this.storeFollowers(
      oldStreamerIds,
      this.twitchStreamerApi,
    )
    return { oldStreamerIds, oldStreamers }
  }

  async updateFirestore(
    storedStreamers: Array<Streamer>,
    removedStreamerIds: Array<string>,
  ) {
    this.streamerRepository.batchUpdateStreamers(
      storedStreamers,
      await this.batchRepository.getBatch(),
    )
    for (const streamer of storedStreamers) {
      this.clipRepository.batchUpdateClip(
        streamer.id,
        new ClipDoc({ streamerInfo: streamer }),
        await this.batchRepository.getBatch(),
      )
    }
    for (const key in removedStreamerIds) {
      this.clipRepository.batchDeleteClipDoc(
        removedStreamerIds[key],
        await this.batchRepository.getBatch(),
      )
    }
    await this.batchRepository.commitBatch()
  }

  async updateStreamerInfo(
    selectedStreamers: Array<Streamer>,
  ): Promise<{ banedIds: Array<string>; storedStreamers: Array<Streamer> }> {
    const selectedStreamerIds = selectedStreamers.map((e) => e.id)

    const storedStreamers =
      await this.twitchStreamerApi.getStreamers(selectedStreamerIds)
    //Re-enter the number of followers
    for (const key in storedStreamers) {
      const streamerInFollowerNum = selectedStreamers.find(
        (e) => e.id == storedStreamers[key].id,
      )
      storedStreamers[key].follower_num = streamerInFollowerNum?.follower_num
    }
    const sortedStreamers = this.sortByFollowerNum(storedStreamers)

    //if baned streamer exist
    const banedIds = selectedStreamerIds.filter((id) =>
      sortedStreamers.every((streamer) => streamer.id !== id),
    )

    return { banedIds, storedStreamers: sortedStreamers }
  }

  async storeTeam(streamers: Streamer[]): Promise<Streamer[]> {
    const result: Streamer[] = []

    for (const streamer of streamers) {
      let teams: Team[] | undefined

      try {
        teams = await this.twitchStreamerApi.getTeams(streamer.id)
      } catch {
        logEntry({
          message: `Failed get ${streamer.display_name} teams from twitch.`,
          severity: "ERROR",
        })
      }

      result.push({
        ...streamer,
        teams,
      })
    }

    return result
  }
}
