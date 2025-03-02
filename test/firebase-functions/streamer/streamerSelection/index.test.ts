import assert from "assert"
import axios from "axios"
import fs from "fs"
import { describe } from "node:test"

import { TwitchStreamerApi } from "../../../../src/apis/streamer"
import { streamerSelection } from "../../../../src/firebase-functions/streamer/streamerSelection"
import { StreamerSelectionLogic } from "../../../../src/firebase-functions/streamer/streamerSelection/streamerSelectionLogic"
import { Stream } from "../../../../src/models/stream"
import { Streamer } from "../../../../src/models/streamer"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { getStreamersSpy } from "../spy"

jest.mock("axios")

interface TeamApiReturn {
  background_image_url?: string
  banner?: string
  broadcaster_id?: string
  broadcaster_login?: string
  broadcaster_name?: string
  created_at?: string
  id?: string
  info?: string
  team_display_name?: string
  team_name?: string
  thumbnail_url?: string
  updated_at?: string
}

interface TeamsTestData {
  id: string
  response: TeamApiReturn[]
}

describe("streamerSelectionの統合テスト", () => {
  const mockedAxios = axios as jest.MockedFunction<typeof axios>
  let streamerSelectionLogic: StreamerSelectionLogic

  beforeAll(async () => {
    mockedAxios.mockResolvedValueOnce({
      data: {
        access_token: "test",
        expire_in: 0,
        token_type: "test",
      },
    })
    streamerSelectionLogic = await StreamerSelectionLogic.init()
  })

  beforeEach(async () => {
    mockedAxios.mockResolvedValueOnce({
      data: {
        access_token: "test",
        expire_in: 0,
        token_type: "test",
      },
    })
    const oldStreamer: Streamer[] = getStreamersSpy(
      streamerSelectionLogic.STREAMER_NUM_LIMIT,
    )
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

  test("streamerSelectionの実行テスト", async () => {
    //準備
    const streamerRepository = new StreamerRepository()
    const clipRepository = new ClipRepository()

    const oldStreamer = await streamerRepository.getStreamers()
    const oldStreamerIds = oldStreamer.map((e) => e.id)
    //mock
    const getJpStreamsSpy = jest
      .spyOn(TwitchStreamerApi.prototype, "getJpStreams")
      .mockImplementation(async () => {
        const streams: Array<Stream> = JSON.parse(
          fs.readFileSync(
            "test/test_data/streamerSelection/jpStreams.json",
            "utf-8",
          ),
        )
        return streams
      })
    const oldStreamersMockData: Streamer[] = oldStreamer
    const newStreamersMockData: Streamer[] = JSON.parse(
      fs.readFileSync(
        "test/test_data/streamerSelection/newStreamer.json",
        "utf-8",
      ),
    )
    const teamsMockData: TeamsTestData[] = JSON.parse(
      fs.readFileSync("test/test_data/streamerSelection/teams.json", "utf-8"),
    )
    const allStreamersMockData =
      newStreamersMockData.concat(oldStreamersMockData)
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

        return teams?.response ?? []
      })

    //実行
    await streamerSelection()

    //呼び出し回数チェック
    expect(getJpStreamsSpy).toHaveBeenCalledTimes(1)
    expect(getFollowerNumSpy).toHaveBeenCalledTimes(
      streamerSelectionLogic.STREAMER_NUM_LIMIT + 1,
    ) //1つ追加になる
    expect(getStreamersSpy).toHaveBeenCalledTimes(1)
    expect(getTeamsSpy).toHaveBeenCalledTimes(
      streamerSelectionLogic.STREAMER_NUM_LIMIT,
    )

    const newStreamer = await streamerRepository.getStreamers()
    const newStreamerIds = newStreamer.map((e) => e.id)
    const removedStreamerIds = oldStreamerIds.filter(
      (id) => newStreamerIds.indexOf(id) == -1,
    )

    //ドキュメントが作成されている,ストリーマーリストのドキュメントが作成されている
    for (const key in newStreamerIds) {
      const id = newStreamerIds[key]
      const clipDoc = await clipRepository.getClip(id)
      expect(clipDoc).toBeDefined()
      expect(clipDoc.streamerInfo?.display_name).toBeDefined()
      expect(clipDoc.streamerInfo?.profile_image_url).toBeDefined()
      expect(clipDoc.streamerInfo?.description).toBeDefined()
      expect(clipDoc.streamerInfo?.follower_num).toBeDefined()
    }

    //ドキュメントが削除されている
    for (const key in removedStreamerIds) {
      const id = removedStreamerIds[key]
      await expect(clipRepository.getClip(id)).rejects.toThrow()
    }

    //ストリーマー情報チェック
    expect(newStreamer.length).toBeGreaterThan(0)

    //主要な情報があるか
    for (const streamer of newStreamer) {
      //idが存在しているか
      expect(streamer.id).toBeDefined()
      //その他主要な項目があるか
      expect(streamer.created_at).toBeDefined()
      expect(streamer.description).toBeDefined()
      expect(streamer.display_name).toBeDefined()
      expect(streamer.login).toBeDefined()
      expect(streamer.profile_image_url).toBeDefined()
      expect(streamer.follower_num).toBeDefined()
      expect(streamer.teams).toBeDefined()

      // teams内のデータの内容が正しいか
      const teams = teamsMockData.find(({ id }) => id == streamer.id)
      const expectedTeams = teams?.response ?? []

      for (const { id, info, team_display_name, team_name } of expectedTeams) {
        const resultTeams = streamer.teams?.find(({ id: _id }) => _id == id)

        expect(resultTeams).toBeDefined()
        expect(resultTeams?.display_name).toEqual(team_display_name)
        expect(resultTeams?.info).toEqual(info)
        expect(resultTeams?.name).toEqual(team_name)
      }
    }

    //順番チェック
    for (let index = 0; index < newStreamer.length - 1; index++) {
      const currentFollowerNum = newStreamer[index].follower_num
      const nextFollowerNum = newStreamer[index + 1].follower_num
      const message = "clips.view_count is undefined"
      assert(typeof currentFollowerNum === "number", message)
      assert(typeof nextFollowerNum === "number", message)
      expect(currentFollowerNum).toBeGreaterThanOrEqual(nextFollowerNum)
    }

    //重複チェック
    const newStreamerIdSets = new Set(newStreamerIds)
    expect(newStreamerIdSets.size).toEqual(newStreamerIds.length)
  }, 20000)
})
