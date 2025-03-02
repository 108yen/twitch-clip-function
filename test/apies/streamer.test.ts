import { describe } from "node:test"

import { TwitchStreamerApi } from "../../src/apis/streamer"

describe("TwitchStreamerApiのテスト", () => {
  let twitchStreamerApi: TwitchStreamerApi
  beforeAll(async () => {
    twitchStreamerApi = await TwitchStreamerApi.init(
      process.env.TWITCH_CLIENT_ID!,
      process.env.TWITCH_CLIENT_SECRET!,
    )
  })

  test("getFollowerNum", async () => {
    const id = "49207184" //釈迦
    const followerNum = await twitchStreamerApi.getFollowerNum(id)
    expect(followerNum).toBeGreaterThan(0)
  })

  test("getStreamers:id指定", async () => {
    const idList = ["49207184", "50988750"]
    const streamers = await twitchStreamerApi.getStreamers(idList)

    //streamerが存在しているか
    expect(streamers.length).toBeGreaterThan(0)
    for (const key in streamers) {
      const element = streamers[key]
      //idが存在しているか
      expect(element.id).toBeDefined()
      //その他主要な項目があるか
      expect(element.created_at).toBeDefined()
      expect(element.description).toBeDefined()
      expect(element.display_name).toBeDefined()
      expect(element.login).toBeDefined()
      expect(element.profile_image_url).toBeDefined()
    }
  })

  test("getJpStreams", async () => {
    const streams = await twitchStreamerApi.getJpStreams()

    expect(streams.length).toBeGreaterThan(90)
    for (const key in streams) {
      const stream = streams[key]
      expect(stream.user_id).toBeDefined()
      expect(stream.user_login).toBeDefined()
      expect(stream.viewer_count).toBeDefined()
      expect(stream.tags).toBeDefined()
    }
  })

  test("getTeams", async () => {
    const tenteiForteId = "854833174"
    const teams = await twitchStreamerApi.getTeams(tenteiForteId)

    expect(teams).toHaveLength(1)

    const {
      background_image_url,
      banner,
      created_at,
      display_name,
      id,
      info,
      name,
      thumbnail_url,
      updated_at,
    } = teams[0]

    expect(background_image_url).toBeDefined()
    expect(banner).toBeDefined()
    expect(created_at).toBeDefined()
    expect(display_name).toEqual("Neo-Porte")
    expect(id).toBeDefined()
    expect(info).toBeDefined()
    expect(name).toEqual("neoporte")
    expect(thumbnail_url).toBeDefined()
    expect(updated_at).toBeDefined()
  })
})
