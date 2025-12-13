import axios from "axios"
import fs from "fs"
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  MockedFunction,
  test,
  vi,
} from "vitest"
import { TwitchClipApi } from "../../../../src/apis/clip"
import { RANGE_DATE } from "../../../../src/constant"
import { UpdatePastRankingLogic } from "../../../../src/firebase-functions/clip/updatePastRanking/updatePastRankingLogic"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { Streamer } from "../../../../src/models/streamer"
import { BatchRepository } from "../../../../src/repositories/batch"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import dayjs from "../../../../src/utils/dayjs"
import { clipElementCheck, clipOrderCheck } from "../checkFunctions"
import { getClipsSpyImp, getJSTDate } from "../spy"

vi.mock("axios")

describe("UpdatePastRankingLogicのテスト", () => {
  let updatePastRankingLogic: UpdatePastRankingLogic
  const currentYear = getJSTDate().getFullYear()
  const fiveYearsAgo = currentYear - RANGE_DATE.PastRangeYears
  const calcCall = (createdAt: number) =>
    createdAt > fiveYearsAgo
      ? currentYear - createdAt
      : RANGE_DATE.PastRangeYears
  const mockedAxios = axios as unknown as MockedFunction<typeof axios>

  beforeAll(async () => {
    mockedAxios.mockResolvedValueOnce({
      data: {
        access_token: "test",
        expire_in: 0,
        token_type: "test",
      },
    })
    updatePastRankingLogic = await UpdatePastRankingLogic.init()
  })

  afterEach(() => {
    mockedAxios.mockRestore()
    vi.restoreAllMocks()
  })

  test("getPeriodsのテスト", async () => {
    const streamers: Array<Streamer> = JSON.parse(
      fs.readFileSync("test/test_data/clip/streamer.json", "utf-8"),
    )
    for (const streamer of streamers) {
      const created_at = new Date(streamer!.created_at!)

      const periods = updatePastRankingLogic.getPeriods(streamer)

      expect(Object.keys(periods).length).toEqual(
        calcCall(created_at.getFullYear()),
      )
      for (const key in periods) {
        const period = periods[key]
        const started_at = dayjs()
          .set("year", Number(key))
          .tz()
          .startOf("year")
          .toISOString()
        const ended_at = dayjs()
          .set("year", Number(key))
          .tz()
          .endOf("year")
          .toISOString()

        expect({
          ended_at: period.ended_at?.toISOString(),
          started_at: period.started_at?.toISOString(),
        }).toEqual({
          ended_at,
          started_at,
        })
      }
    }
  })

  describe("getStreamersのテスト", () => {
    test("正常処理", async () => {
      const getStreamersSpy = vi
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

      const streamers = await updatePastRankingLogic["getStreamers"]()

      expect(getStreamersSpy).toHaveBeenCalled()
      expect(streamers).toEqual([
        new Streamer({
          follower_num: 100,
          id: "49207184",
        }),
        new Streamer({
          follower_num: 200,
          id: "545050196",
        }),
      ])
    }, 100000)

    test("firestoreエラー", async () => {
      const getStreamersSpy = vi
        .spyOn(StreamerRepository.prototype, "getStreamers")
        .mockRejectedValueOnce(new Error("firestore error test"))

      await expect(updatePastRankingLogic["getStreamers"]()).rejects.toThrow()
      expect(getStreamersSpy).toHaveBeenCalled()
    }, 100000)
  })

  describe("getClipForEachStreamersのテスト", () => {
    test("正常処理", async () => {
      const getClipsSpy = vi
        .spyOn(TwitchClipApi.prototype, "getClips")
        .mockImplementation(getClipsSpyImp)
      const updateClipDocSpy = vi
        .spyOn(ClipRepository.prototype, "batchUpdateClip")
        .mockImplementation(async () => {
          /* do nothing */
        })
      const commitBatchSpy = vi
        .spyOn(BatchRepository.prototype, "commitBatch")
        .mockResolvedValue()

      const streamer: Array<Streamer> = JSON.parse(
        fs.readFileSync("test/test_data/clip/streamer.json", "utf-8"),
      )

      await updatePastRankingLogic["getClipForEachStreamers"](streamer)

      //呼び出し回数チェック
      const katoCreatedAt = 2020
      const sekiCreatedAt = 2016
      const expectCallGetClips =
        calcCall(katoCreatedAt) + calcCall(sekiCreatedAt)
      expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips)
      expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
      expect(commitBatchSpy).toHaveBeenCalledTimes(1)

      //中身のデータチェック
      for (const key in updateClipDocSpy.mock.calls) {
        if (
          Object.prototype.hasOwnProperty.call(updateClipDocSpy.mock.calls, key)
        ) {
          const args = updateClipDocSpy.mock.calls[key]

          //順番チェック
          for (const [, clips] of args[1].clipsMap) {
            expect(clips.length).toEqual(100)
            clipOrderCheck(clips)
            clipElementCheck(clips)
          }
        }
      }
    }, 100000)

    test("Twitch API エラー", async () => {
      const getClipsSpy = vi
        .spyOn(TwitchClipApi.prototype, "getClips")
        .mockRejectedValue(new Error("axios error test"))
      const updateClipDocSpy = vi
        .spyOn(ClipRepository.prototype, "batchUpdateClip")
        .mockImplementation(async () => {
          /* do nothing */
        })
      const commitBatchSpy = vi
        .spyOn(BatchRepository.prototype, "commitBatch")
        .mockResolvedValue()
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        /* do nothing */
      })

      const streamer: Array<Streamer> = JSON.parse(
        fs.readFileSync("test/test_data/clip/streamer.json", "utf-8"),
      )

      await updatePastRankingLogic["getClipForEachStreamers"](streamer)

      //呼び出し回数チェック
      const katoCreatedAt = 2020
      const sekiCreatedAt = 2016
      const expectCallGetClips =
        calcCall(katoCreatedAt) + calcCall(sekiCreatedAt)
      expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips)
      //summaryの更新で一度コールされる
      expect(updateClipDocSpy).toHaveBeenCalledTimes(1)
      expect(commitBatchSpy).toHaveBeenCalledTimes(1)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /Failed to get [\w-]+'s [\w-]+ clips by twitch api./,
        ),
      )
    })

    test("firestoreエラー", async () => {
      const getClipsSpy = vi
        .spyOn(TwitchClipApi.prototype, "getClips")
        .mockImplementation(getClipsSpyImp)
      const updateClipDocSpy = vi
        .spyOn(ClipRepository.prototype, "batchUpdateClip")
        .mockImplementation(async () => {
          /* do nothing */
        })
      const commitBatchSpy = vi
        .spyOn(BatchRepository.prototype, "commitBatch")
        .mockRejectedValue(new Error("batch commit error test"))

      const streamer: Array<Streamer> = JSON.parse(
        fs.readFileSync("test/test_data/clip/streamer.json", "utf-8"),
      )

      await expect(
        updatePastRankingLogic["getClipForEachStreamers"](streamer),
      ).rejects.toThrow()

      //呼び出し回数チェック
      const katoCreatedAt = 2020
      const sekiCreatedAt = 2016
      const expectCallGetClips =
        calcCall(katoCreatedAt) + calcCall(sekiCreatedAt)
      expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips)
      expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
      expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    })
  })

  test("deleteOverLimitYearのテスト", async () => {
    //何年かこのものまで格納する想定か設定する
    //ここで制限はみ出している年のものが削除される
    const setAgo = 7
    const getStreamersSpy = vi
      .spyOn(StreamerRepository.prototype, "getStreamers")
      .mockResolvedValue([
        new Streamer({
          created_at: new Date(currentYear - setAgo, 1, 1).toISOString(),
          follower_num: 100,
          id: "49207184",
        }),
        new Streamer({
          created_at: new Date(currentYear, 1, 1).toISOString(),
          follower_num: 200,
          id: "545050196",
        }),
      ])
    const getClipSpy = vi
      .spyOn(ClipRepository.prototype, "getClip")
      .mockImplementation(async () => {
        const clipDoc = new ClipDoc()
        for (
          let year = currentYear - 1;
          year > currentYear - setAgo - 1;
          year--
        ) {
          clipDoc.clipsMap.set(year.toString(), [])
        }
        return clipDoc
      })
    const batchDeleteFieldValueSpy = vi
      .spyOn(ClipRepository.prototype, "batchDeleteFieldValue")
      .mockImplementation(async () => {
        /* do nothing */
      })
    const commitBatchSpy = vi
      .spyOn(BatchRepository.prototype, "commitBatch")
      .mockResolvedValue()

    await updatePastRankingLogic["deleteOverLimitYear"]()

    expect(getStreamersSpy).toHaveBeenCalledTimes(1)
    //past_summaryとストリーマー一人分で2倍呼ばれる
    expect(batchDeleteFieldValueSpy).toHaveBeenCalledTimes(
      (setAgo - RANGE_DATE.PastRangeYears) * 2,
    )
    expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    expect(getClipSpy).toHaveBeenCalledTimes(1)

    //deleteFieldVal呼ばれるときの引数の確認
    for (const args of batchDeleteFieldValueSpy.mock.calls) {
      const [, key] = args

      expect(Number(key)).toBeLessThan(fiveYearsAgo)
    }
  })
})
