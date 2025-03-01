import axios from "axios"

import { StreamerSelectionLogic } from "../../../../src/firebase-functions/streamer/streamerSelection/streamerSelectionLogic"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { Stream } from "../../../../src/models/stream"
import { Streamer } from "../../../../src/models/streamer"
import { BatchRepository } from "../../../../src/repositories/batch"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"

jest.mock("axios")

describe("StreamerSelectionLogicのテスト", () => {
  let streamerSelectionLogic: StreamerSelectionLogic
  const mockedAxios = axios as jest.MockedFunction<typeof axios>

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

  afterEach(() => {
    mockedAxios.mockRestore()
    jest.restoreAllMocks()
  })

  test("getOldStreamerのテスト", async () => {
    mockedAxios.mockResolvedValueOnce({ data: { total: 400 } })
    mockedAxios.mockResolvedValueOnce({ data: { total: 500 } })
    const getStreamersSpy = jest
      .spyOn(StreamerRepository.prototype, "getStreamers")
      .mockResolvedValue([
        new Streamer({
          follower_num: 100,
          id: "49207184",
        }),
        new Streamer({
          follower_num: 200,
          id: "545050196",
        }),
      ])

    const { oldStreamerIds, oldStreamers } =
      await streamerSelectionLogic.getOldStreamer()

    expect(getStreamersSpy).toHaveBeenCalled()
    expect(oldStreamers.map((e) => e.id)).toEqual(oldStreamerIds)
    expect(oldStreamers).toEqual([
      new Streamer({
        follower_num: 400,
        id: "49207184",
      }),
      new Streamer({
        follower_num: 500,
        id: "545050196",
      }),
    ])
  }, 100000)

  test("getOldStreamerのテスト:axiosエラー", async () => {
    mockedAxios.mockRejectedValueOnce(new Error("axios error test"))
    const getStreamersSpy = jest
      .spyOn(StreamerRepository.prototype, "getStreamers")
      .mockResolvedValue([
        new Streamer({
          follower_num: 100,
          id: "49207184",
        }),
        new Streamer({
          follower_num: 200,
          id: "545050196",
        }),
      ])

    await expect(streamerSelectionLogic.getOldStreamer()).rejects.toThrow()
    expect(getStreamersSpy).toHaveBeenCalled()
  }, 100000)

  test("getOldStreamerのテスト:firestoreエラー", async () => {
    mockedAxios.mockResolvedValueOnce({ data: { total: 400 } })
    mockedAxios.mockResolvedValueOnce({ data: { total: 500 } })
    const getStreamersSpy = jest
      .spyOn(StreamerRepository.prototype, "getStreamers")
      .mockRejectedValueOnce(new Error("firestore error test"))

    await expect(streamerSelectionLogic.getOldStreamer()).rejects.toThrow()
    expect(getStreamersSpy).toHaveBeenCalled()
  }, 100000)

  test("getJpLiveStreamingのテスト", async () => {
    const mockData = [...Array(100)].map(
      (_, index) =>
        new Stream({
          language: "ja",
          tags: [""],
          user_id: `${index}`,
          viewer_count: index,
        }),
    )
    mockedAxios.mockResolvedValueOnce({ data: { data: mockData } })

    const streams = await streamerSelectionLogic.getJpLiveStreaming()

    expect(streams.length).toEqual(100)
    for (let index = 0; index < streams.length; index++) {
      const stream = streams[index]
      expect(stream.user_id).toEqual(`${index}`)
      expect(stream.tags).toEqual([""])
      expect(stream.language).toEqual("ja")
      expect(stream.viewer_count).toEqual(index)
    }
  }, 100000)

  test("getJpLiveStreamingのテスト:axiosエラー", async () => {
    mockedAxios.mockRejectedValueOnce(new Error("axios error test"))
    await expect(streamerSelectionLogic.getJpLiveStreaming()).rejects.toThrow()
  }, 100000)

  test("filterStreamsのテスト", () => {
    const oldStreamerIdsMockData = ["102631269", "104363564"]
    const streamsMockData = [
      //追加
      new Stream({
        tags: [""],
        user_id: "49207184",
        viewer_count: 500,
      }),
      //重複削除
      new Stream({
        tags: [""],
        user_id: "49207184",
        viewer_count: 400,
      }),
      // タグで削除
      new Stream({
        tags: ["Commissions", "日本語"],
        user_id: "545050196",
        viewer_count: 300,
      }),
      // idで削除
      new Stream({
        tags: [""],
        user_id: "126482446",
        viewer_count: 300,
      }),
      // 既存
      new Stream({
        tags: [""],
        user_id: "104363564",
        viewer_count: 300,
      }),
      // viewer count足りない
      new Stream({
        tags: [""],
        user_id: "104363564",
        viewer_count: 200,
      }),
    ]

    const newStreamerIds = streamerSelectionLogic.filterStreams(
      streamsMockData,
      oldStreamerIdsMockData,
    )

    expect(newStreamerIds).toEqual(["49207184"])
  }, 100000)

  test("getNewStreamerFollowerのテスト", async () => {
    mockedAxios.mockResolvedValueOnce({ data: { total: 400 } })
    mockedAxios.mockResolvedValueOnce({ data: { total: 500 } })
    const ids = ["49207184", "545050196"]

    const newStreamers =
      await streamerSelectionLogic.getNewStreamerFollower(ids)

    expect(newStreamers).toEqual([
      new Streamer({
        follower_num: 400,
        id: "49207184",
      }),
      new Streamer({
        follower_num: 500,
        id: "545050196",
      }),
    ])
  }, 100000)

  test("getNewStreamerFollowerのテスト:axiosエラー", async () => {
    mockedAxios.mockRejectedValueOnce(new Error("axios error test"))
    const ids = ["49207184", "545050196"]

    expect(streamerSelectionLogic.getNewStreamerFollower(ids)).rejects.toThrow()
  }, 100000)

  test("concatAndFilterのテスト", () => {
    const streamerNumLimit = streamerSelectionLogic.STREAMER_NUM_LIMIT
    const oldStreamers = [...Array(streamerNumLimit - 5)].map(
      (_, index) =>
        new Streamer({
          follower_num: streamerNumLimit - 100 - index,
          id: `${index}`,
        }),
    )
    const newStreamers = [...Array(10)].map(
      (_, index) =>
        new Streamer({
          follower_num: streamerNumLimit + 100 - index,
          id: `${index + streamerNumLimit - 5}`,
        }),
    )
    const { addedStreamerIds, removedStreamerIds, selectedStreamers } =
      streamerSelectionLogic.concatAndFilter(oldStreamers, newStreamers)

    const expectSelectedStreamers = newStreamers
      .concat(oldStreamers)
      .slice(0, streamerNumLimit)
    expect(selectedStreamers).toEqual(expectSelectedStreamers)
    expect(removedStreamerIds).toEqual(oldStreamers.map((e) => e.id).slice(-5))
    expect(addedStreamerIds).toEqual(newStreamers.map((e) => e.id))
  }, 100000)

  test("updateStreamerInfoのテスト", async () => {
    const mockData = [
      new Streamer({
        broadcaster_type: "partner",
        created_at: "2013-09-19T13:21:29Z",
        description: "",
        display_name: "fps_shaka",
        id: "49207184",
        login: "fps_shaka",
        offline_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/282d883a-8e00-4fd3-88fa-bfcbd370c2cd-channel_offline_image-1920x1080.jpeg",
        profile_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/61f568bf-884b-4126-b17c-fc525c6d3bd4-profile_image-300x300.png",
        type: "",
        view_count: 0,
      }),
      new Streamer({
        broadcaster_type: "partner",
        created_at: "2020-06-18T04:04:09Z",
        description: "命尽き果てるまで",
        display_name: "加藤純一です",
        id: "545050196",
        login: "kato_junichi0817",
        offline_image_url: "",
        profile_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/a4977cfd-1962-41ec-9355-ab2611b97552-profile_image-300x300.png",
        type: "",
        view_count: 0,
      }),
    ]
    mockedAxios.mockResolvedValueOnce({ data: { data: mockData } })

    const selectedStreamers = [
      new Streamer({
        follower_num: 100,
        id: "49207184",
      }),
      new Streamer({
        follower_num: 200,
        id: "545050196",
      }),
    ]
    const { storedStreamers } =
      await streamerSelectionLogic.updateStreamerInfo(selectedStreamers)
    const expectData = JSON.parse(JSON.stringify(mockData)).reverse()
    expectData[0].follower_num = 200
    expectData[1].follower_num = 100
    expect(storedStreamers).toEqual(expectData)
  }, 100000)

  test("updateStreamerInfoのテスト:banされたストリーマーがいたとき", async () => {
    const mockData = [
      new Streamer({
        broadcaster_type: "partner",
        created_at: "2013-09-19T13:21:29Z",
        description: "",
        display_name: "fps_shaka",
        id: "49207184",
        login: "fps_shaka",
        offline_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/282d883a-8e00-4fd3-88fa-bfcbd370c2cd-channel_offline_image-1920x1080.jpeg",
        profile_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/61f568bf-884b-4126-b17c-fc525c6d3bd4-profile_image-300x300.png",
        type: "",
        view_count: 0,
      }),
      new Streamer({
        broadcaster_type: "partner",
        created_at: "2020-06-18T04:04:09Z",
        description: "命尽き果てるまで",
        display_name: "加藤純一です",
        id: "545050196",
        login: "kato_junichi0817",
        offline_image_url: "",
        profile_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/a4977cfd-1962-41ec-9355-ab2611b97552-profile_image-300x300.png",
        type: "",
        view_count: 0,
      }),
    ]
    mockedAxios.mockResolvedValueOnce({ data: { data: mockData } })

    const selectedStreamers = [
      new Streamer({
        follower_num: 100,
        id: "49207184",
      }),
      new Streamer({
        follower_num: 200,
        id: "545050196",
      }),
      //banされる想定のやつ
      new Streamer({
        follower_num: 200,
        id: "0000000",
      }),
    ]
    const { banedIds, storedStreamers } =
      await streamerSelectionLogic.updateStreamerInfo(selectedStreamers)
    const expectData = JSON.parse(JSON.stringify(mockData)).reverse()
    expectData[0].follower_num = 200
    expectData[1].follower_num = 100
    expect(storedStreamers).toEqual(expectData)
    expect(banedIds).toEqual(["0000000"])
  }, 100000)

  test("updateStreamerInfoのテスト:axiosエラー", async () => {
    mockedAxios.mockRejectedValueOnce(new Error("axios error test"))

    const selectedStreamers = [
      new Streamer({
        follower_num: 100,
        id: "49207184",
      }),
      new Streamer({
        follower_num: 200,
        id: "545050196",
      }),
    ]
    expect(
      streamerSelectionLogic.updateStreamerInfo(selectedStreamers),
    ).rejects.toThrow()
  }, 100000)

  test("updateFirestoreのテスト", async () => {
    const updateStreamers = jest
      .spyOn(StreamerRepository.prototype, "batchUpdateStreamers")
      .mockImplementation()
    const deleteClipDocSpy = jest
      .spyOn(ClipRepository.prototype, "batchDeleteClipDoc")
      .mockImplementation()
    const updateClipDocSpy = jest
      .spyOn(ClipRepository.prototype, "batchUpdateClip")
      .mockImplementation()
    const commitBatchSpy = jest
      .spyOn(BatchRepository.prototype, "commitBatch")
      .mockResolvedValueOnce()

    const storedStreamers = [
      new Streamer({
        broadcaster_type: "partner",
        created_at: "2013-09-19T13:21:29Z",
        description: "",
        display_name: "fps_shaka",
        follower_num: 100,
        id: "49207184",
        login: "fps_shaka",
        offline_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/282d883a-8e00-4fd3-88fa-bfcbd370c2cd-channel_offline_image-1920x1080.jpeg",
        profile_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/61f568bf-884b-4126-b17c-fc525c6d3bd4-profile_image-300x300.png",
        type: "",
        view_count: 0,
      }),
      new Streamer({
        broadcaster_type: "partner",
        created_at: "2020-06-18T04:04:09Z",
        description: "命尽き果てるまで",
        display_name: "加藤純一です",
        follower_num: 200,
        id: "545050196",
        login: "kato_junichi0817",
        offline_image_url: "",
        profile_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/a4977cfd-1962-41ec-9355-ab2611b97552-profile_image-300x300.png",
        type: "",
        view_count: 0,
      }),
    ]
    const removeStreamerIds = ["102631269", "104363564"]

    await streamerSelectionLogic.updateFirestore(
      storedStreamers,
      removeStreamerIds,
    )

    expect(updateStreamers).toHaveBeenCalledTimes(1)
    expect(updateStreamers.mock.calls[0][0]).toEqual(storedStreamers)
    expect(deleteClipDocSpy).toHaveBeenCalledTimes(2)
    expect(deleteClipDocSpy.mock.calls[0][0]).toEqual(removeStreamerIds[0])
    expect(deleteClipDocSpy.mock.calls[1][0]).toEqual(removeStreamerIds[1])
    expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    expect(updateClipDocSpy).toHaveBeenCalledTimes(2)
    expect(updateClipDocSpy.mock.calls[0][1]).toEqual(
      new ClipDoc({ streamerInfo: storedStreamers[0] }),
    )
    expect(updateClipDocSpy.mock.calls[1][1]).toEqual(
      new ClipDoc({ streamerInfo: storedStreamers[1] }),
    )
  }, 100000)

  test("updateFirestoreのテスト:batchエラー", async () => {
    const updateStreamers = jest
      .spyOn(StreamerRepository.prototype, "batchUpdateStreamers")
      .mockImplementation()
    const deleteClipDocSpy = jest
      .spyOn(ClipRepository.prototype, "batchDeleteClipDoc")
      .mockImplementation()
    const updateClipDocSpy = jest
      .spyOn(ClipRepository.prototype, "batchUpdateClip")
      .mockImplementation()
    const commitBatchSpy = jest
      .spyOn(BatchRepository.prototype, "commitBatch")
      .mockRejectedValueOnce(new Error("batch error test"))

    const storedStreamers = [
      new Streamer({
        broadcaster_type: "partner",
        created_at: "2013-09-19T13:21:29Z",
        description: "",
        display_name: "fps_shaka",
        follower_num: 100,
        id: "49207184",
        login: "fps_shaka",
        offline_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/282d883a-8e00-4fd3-88fa-bfcbd370c2cd-channel_offline_image-1920x1080.jpeg",
        profile_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/61f568bf-884b-4126-b17c-fc525c6d3bd4-profile_image-300x300.png",
        type: "",
        view_count: 0,
      }),
      new Streamer({
        broadcaster_type: "partner",
        created_at: "2020-06-18T04:04:09Z",
        description: "命尽き果てるまで",
        display_name: "加藤純一です",
        follower_num: 200,
        id: "545050196",
        login: "kato_junichi0817",
        offline_image_url: "",
        profile_image_url:
          "https://static-cdn.jtvnw.net/jtv_user_pictures/a4977cfd-1962-41ec-9355-ab2611b97552-profile_image-300x300.png",
        type: "",
        view_count: 0,
      }),
    ]
    const removeStreamerIds = ["102631269", "104363564"]

    await expect(
      streamerSelectionLogic.updateFirestore(
        storedStreamers,
        removeStreamerIds,
      ),
    ).rejects.toThrow()

    expect(updateStreamers).toHaveBeenCalledTimes(1)
    expect(updateStreamers.mock.calls[0][0]).toEqual(storedStreamers)
    expect(deleteClipDocSpy).toHaveBeenCalledTimes(2)
    expect(deleteClipDocSpy.mock.calls[0][0]).toEqual(removeStreamerIds[0])
    expect(deleteClipDocSpy.mock.calls[1][0]).toEqual(removeStreamerIds[1])
    expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    expect(updateClipDocSpy).toHaveBeenCalledTimes(2)
    expect(updateClipDocSpy.mock.calls[0][1]).toEqual(
      new ClipDoc({ streamerInfo: storedStreamers[0] }),
    )
    expect(updateClipDocSpy.mock.calls[1][1]).toEqual(
      new ClipDoc({ streamerInfo: storedStreamers[1] }),
    )
  }, 100000)

  test("storeTeamsのテスト", async () => {
    const streamers: Streamer[] = [
      {
        broadcaster_type: "partner",
        created_at: "2013-09-19T13:21:29Z",
        description: "",
        display_name: "天帝フォルテ",
        id: "854833174",
        login: "tentei_forte",
        offline_image_url: "",
        profile_image_url: "",
        type: "",
        view_count: 0,
      },
      {
        broadcaster_type: "partner",
        created_at: "2020-06-18T04:04:09Z",
        description: "命尽き果てるまで",
        display_name: "加藤純一です",
        id: "545050196",
        login: "kato_junichi0817",
        offline_image_url: "",
        profile_image_url: "",
        type: "",
        view_count: 0,
      },
    ]

    mockedAxios.mockImplementation(async (url) => {
      const broadcaster_id = (url as unknown as any)?.params.broadcaster_id

      if (broadcaster_id == "854833174") {
        return {
          data: {
            data: [
              {
                background_image_url: null,
                banner: null,
                broadcaster_id: "854833174",
                broadcaster_login: "tentei_forte",
                broadcaster_name: "天帝フォルテ",
                created_at: "2023-02-19T21:30:14Z",
                id: "988431688",
                info: "",
                team_display_name: "Neo-Porte",
                team_name: "neoporte",
                thumbnail_url:
                  "https://static-cdn.jtvnw.net/team-assets/neoporte-38956fd9f173478a8556db14c3f94d72.png",
                updated_at: "2024-12-11T13:54:54Z",
              },
            ],
          },
        }
      } else {
        return { data: { data: [] } }
      }
    })

    const result = await streamerSelectionLogic.storeTeam(streamers)

    const expectedResult = [
      {
        broadcaster_type: "partner",
        created_at: "2013-09-19T13:21:29Z",
        description: "",
        display_name: "天帝フォルテ",
        id: "854833174",
        login: "tentei_forte",
        offline_image_url: "",
        profile_image_url: "",
        teams: [
          {
            background_image_url: null,
            banner: null,
            created_at: "2023-02-19T21:30:14Z",
            display_name: "Neo-Porte",
            id: "988431688",
            info: "",
            name: "neoporte",
            thumbnail_url:
              "https://static-cdn.jtvnw.net/team-assets/neoporte-38956fd9f173478a8556db14c3f94d72.png",
            updated_at: "2024-12-11T13:54:54Z",
          },
        ],
        type: "",
        view_count: 0,
      },
      {
        broadcaster_type: "partner",
        created_at: "2020-06-18T04:04:09Z",
        description: "命尽き果てるまで",
        display_name: "加藤純一です",
        id: "545050196",
        login: "kato_junichi0817",
        offline_image_url: "",
        profile_image_url: "",
        teams: [],
        type: "",
        view_count: 0,
      },
    ]

    expect(result).toStrictEqual(expectedResult)
  })
})
