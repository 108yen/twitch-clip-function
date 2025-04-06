import assert from "assert"
import axios from "axios"
import { describe } from "node:test"

import { TwitchStreamerApi } from "../../../../src/apis/streamer"
import { STREAMER } from "../../../../src/constant"
import { streamerSelection } from "../../../../src/firebase-functions/streamer/streamerSelection"
import { Stream } from "../../../../src/models/stream"
import { Streamer } from "../../../../src/models/streamer"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { JP_STREAMS, NEW_STREAMER } from "../../../test_data/streamer-selection"
import { getStreamersSpy, getTeamsSpyData } from "../spy"

jest.mock("axios")

describe("streamerSelectionの統合テスト", () => {
  const mockedAxios = axios as jest.MockedFunction<typeof axios>

  beforeAll(async () => {
    mockedAxios.mockResolvedValueOnce({
      data: {
        access_token: "test",
        expire_in: 0,
        token_type: "test",
      },
    })
  })

  beforeEach(async () => {
    mockedAxios.mockResolvedValueOnce({
      data: {
        access_token: "test",
        expire_in: 0,
        token_type: "test",
      },
    })
    const oldStreamer: Streamer[] = getStreamersSpy(STREAMER.num)
    const streamerRepository = new StreamerRepository()
    const clipRepository = new ClipRepository()
    await streamerRepository.updateStreamers(oldStreamer)
    for (const streamer of oldStreamer) {
      await clipRepository.createClipDoc(streamer.id)
    }
  })

  afterEach(async () => {
    const streamerRepository = new StreamerRepository()
    const clipRepository = new ClipRepository()
    const streamers = await streamerRepository.getStreamers()
    for (const streamer of streamers) {
      await clipRepository.deleteClipDoc(streamer.id)
    }
    await streamerRepository.updateStreamers([])

    jest.restoreAllMocks()
  })

  async function mocks() {
    //準備
    const streamerRepository = new StreamerRepository()
    const clipRepository = new ClipRepository()

    const oldStreamer = await streamerRepository.getStreamers()
    const oldStreamerIds = oldStreamer.map((e) => e.id)
    const allStreamersMockData = (NEW_STREAMER as Streamer[]).concat(
      oldStreamer,
    )
    const teamsMockData = allStreamersMockData.map(
      ({ display_name, id, login }) => {
        const teams = getTeamsSpyData(id, display_name, login)

        return {
          id,
          teams,
        }
      },
    )

    //mock
    const getJpStreamsSpy = jest
      .spyOn(TwitchStreamerApi.prototype, "getJpStreams")
      .mockImplementation(async () => JP_STREAMS as Stream[])

    const getFollowerNumSpy = jest
      .spyOn(TwitchStreamerApi.prototype, "getFollowerNum")
      .mockImplementation(async (id: string) => {
        const streamer = allStreamersMockData.find(
          (streamer) => streamer.id == id,
        )
        assert(typeof streamer?.follower_num !== "undefined")
        return streamer.follower_num
      })

    const getStreamersSpy = jest
      .spyOn(TwitchStreamerApi.prototype, "getStreamers")
      .mockImplementation(async (ids: Array<string>) => {
        return allStreamersMockData
          .map((streamer) => {
            streamer.follower_num = undefined
            return streamer
          })
          .filter((streamer) => ids.includes(streamer.id))
      })

    const getTeamsSpy = jest
      .spyOn(TwitchStreamerApi.prototype, "getTeams")
      .mockImplementation(async (id) => {
        const teams = teamsMockData.find(({ id: _id }) => _id == id)

        return teams?.teams ?? []
      })

    return {
      clipRepository,
      getFollowerNumSpy,
      getJpStreamsSpy,
      getStreamersSpy,
      getTeamsSpy,
      oldStreamerIds,
      streamerRepository,
      teamsMockData,
    }
  }

  test("呼び出し回数チェック", async () => {
    const { getFollowerNumSpy, getJpStreamsSpy, getStreamersSpy, getTeamsSpy } =
      await mocks()

    await streamerSelection()

    expect(getJpStreamsSpy).toHaveBeenCalledTimes(1)
    expect(getFollowerNumSpy).toHaveBeenCalledTimes(STREAMER.num + 1) //1つ追加になる
    expect(getStreamersSpy).toHaveBeenCalledTimes(1)
    expect(getTeamsSpy).toHaveBeenCalledTimes(STREAMER.num)
  })

  describe("streamersのdocument内のデータチェック", async () => {
    test("内容チェック", async () => {
      const { streamerRepository, teamsMockData } = await mocks()

      await streamerSelection()

      const streamers = await streamerRepository.getStreamers()

      expect(streamers).toHaveLength(STREAMER.num)

      for (const {
        created_at,
        description,
        display_name,
        follower_num,
        id,
        login,
        profile_image_url,
        teams,
      } of streamers) {
        expect(id).toBeDefined()
        expect(id).not.toEqual("")
        expect(created_at).toBeDefined()
        expect(description).toBeDefined()
        expect(display_name).toBeDefined()
        expect(display_name).not.toEqual("")
        expect(login).toBeDefined()
        expect(login).not.toEqual("")
        expect(profile_image_url).toBeDefined()
        expect(profile_image_url).not.toEqual("")
        expect(follower_num).toBeDefined()
        expect(teams).toBeDefined()

        const expectedTeams = teamsMockData.find(({ id: _id }) => _id == id)
        expect(expectedTeams).toBeDefined()
        expect(teams).toStrictEqual(expectedTeams!.teams)
      }
    })

    test("順番チェック", async () => {
      const { streamerRepository } = await mocks()

      await streamerSelection()

      const streamers = await streamerRepository.getStreamers()

      for (let index = 0; index < streamers.length - 1; index++) {
        const currentFollowerNum = streamers[index].follower_num
        const nextFollowerNum = streamers[index + 1].follower_num

        expect(typeof currentFollowerNum).toBe("number")
        expect(typeof nextFollowerNum).toBe("number")
        expect(currentFollowerNum).toBeGreaterThanOrEqual(nextFollowerNum!)
      }
    })

    test("重複チェック", async () => {
      const { streamerRepository } = await mocks()

      await streamerSelection()

      const streamers = await streamerRepository.getStreamers()
      const ids = streamers.map((e) => e.id)

      const newStreamerIdSets = new Set(ids)
      expect(newStreamerIdSets.size).toEqual(ids.length)
    })
  })

  test("clipsのdocument内のデータ作成チェック", async () => {
    const { clipRepository, streamerRepository } = await mocks()

    await streamerSelection()

    const streamers = await streamerRepository.getStreamers()

    expect(streamers).toHaveLength(STREAMER.num)

    for (const {
      description,
      display_name,
      follower_num,
      id,
      profile_image_url,
    } of streamers) {
      const clipDoc = await clipRepository.getClip(id)

      expect(clipDoc).toBeDefined()
      expect(clipDoc.streamerInfo?.display_name).not.toEqual("")
      expect(clipDoc.streamerInfo?.display_name).toEqual(display_name)
      expect(clipDoc.streamerInfo?.profile_image_url).toEqual(profile_image_url)
      expect(clipDoc.streamerInfo?.description).toEqual(description)
      expect(clipDoc.streamerInfo?.follower_num).toEqual(follower_num)
    }
  }, 7000)

  test("削除処理チェック", async () => {
    const { clipRepository, oldStreamerIds, streamerRepository } = await mocks()

    await streamerSelection()

    const newStreamer = await streamerRepository.getStreamers()
    const removedStreamerIds = oldStreamerIds.filter(
      (id) => !newStreamer.some(({ id: _id }) => _id === id),
    )

    removedStreamerIds.forEach(
      async (id) => await expect(clipRepository.getClip(id)).rejects.toThrow(),
    )
  })
})
