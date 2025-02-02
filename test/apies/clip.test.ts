import { describe } from "node:test"

import { TwitchClipApi } from "../../src/apis/clip"
import { Clip } from "../../src/models/clip"
import dayjs from "../../src/utils/dayjs"

describe("TwitchClipApiのテスト", () => {
  const broadcasterId = 203654142 // ファン太
  let twitchClipApi: TwitchClipApi

  beforeAll(async () => {
    twitchClipApi = await TwitchClipApi.init(
      process.env.TWITCH_CLIENT_ID!,
      process.env.TWITCH_CLIENT_SECRET!,
    )
  })

  test("getClips:期間指定", async () => {
    const now = dayjs()
    const daysAgo = now.subtract(1, "year")
    const result: Array<Clip> = await twitchClipApi.getClips(
      broadcasterId,
      daysAgo,
      now,
    )

    expect(result.length).toBeGreaterThan(90)

    for (const clip of result) {
      const {
        broadcaster_name,
        created_at,
        creator_name,
        embed_url,
        title,
        view_count,
      } = clip

      expect(title).toBeDefined()
      expect(view_count).toBeDefined()
      expect(created_at).toBeDefined()
      expect(broadcaster_name).toBeDefined()
      expect(embed_url).toBeDefined()
      expect(creator_name).toBeDefined()

      const date = dayjs(created_at!)
      expect(date.unix()).toBeGreaterThanOrEqual(daysAgo.unix())
      expect(date.unix()).toBeLessThanOrEqual(now.unix())
    }
  })

  test("getClips:期間未指定", async () => {
    const result: Array<Clip> = await twitchClipApi.getClips(broadcasterId)

    expect(result.length).toBeGreaterThan(90)

    for (const clip of result) {
      const {
        broadcaster_name,
        created_at,
        creator_name,
        embed_url,
        title,
        view_count,
      } = clip

      expect(title).toBeDefined()
      expect(view_count).toBeDefined()
      expect(created_at).toBeDefined()
      expect(broadcaster_name).toBeDefined()
      expect(embed_url).toBeDefined()
      expect(creator_name).toBeDefined()
    }
  })
})
