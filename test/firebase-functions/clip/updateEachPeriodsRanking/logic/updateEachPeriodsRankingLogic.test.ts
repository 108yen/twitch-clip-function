import axios from "axios"
import fs from "fs"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"
import { MockedFunction } from "vitest"
import { TwitchClipApi } from "../../../../../src/apis/clip"
import { UpdateEachPeriodsRankingLogic } from "../../../../../src/firebase-functions/clip/updateEachPeriodsRanking/logic/updateEachPeriodsRankingLogic"
import { Streamer } from "../../../../../src/models/streamer"
import { BatchRepository } from "../../../../../src/repositories/batch"
import { ClipRepository } from "../../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../../src/repositories/streamer"
import { clipElementCheck, clipOrderCheck } from "../../checkFunctions"
import { getClipsSpyImp } from "../../spy"

vi.mock("axios")

describe("UpdateEachPeriodsRankingLogicのテスト", () => {
  let updateEachPeriodsRankingLogic: UpdateEachPeriodsRankingLogic

  beforeAll(async () => {
    const mockedAxios = axios as unknown as MockedFunction<typeof axios>
    mockedAxios.mockResolvedValueOnce({
      data: {
        access_token: "test",
        expire_in: 0,
        token_type: "test",
      },
    })
    updateEachPeriodsRankingLogic = await UpdateEachPeriodsRankingLogic.init(
      "day",
      1,
    )
  })

  afterEach(() => vi.restoreAllMocks())

  test("getPeriodsのテスト", () => {
    const periods = updateEachPeriodsRankingLogic.getPeriods()

    expect(typeof periods["day"].started_at).toBeDefined()
    expect(typeof periods["day"].ended_at).toBeDefined()
    expect(
      periods["day"].ended_at!.unix() - periods["day"].started_at!.unix(),
    ).toEqual(24 * 60 * 60)
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

      const streamers = await updateEachPeriodsRankingLogic["getStreamers"]()

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

      await expect(
        updateEachPeriodsRankingLogic["getStreamers"](),
      ).rejects.toThrow()
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
        .mockImplementation(() => {
          /* do nothing */
        })
      const commitBatchSpy = vi
        .spyOn(BatchRepository.prototype, "commitBatch")
        .mockResolvedValue()

      const streamer: Array<Streamer> = JSON.parse(
        fs.readFileSync("test/test_data/clip/streamer.json", "utf-8"),
      )

      await updateEachPeriodsRankingLogic["getClipForEachStreamers"](streamer)

      //呼び出し回数チェック
      expect(getClipsSpy).toHaveBeenCalledTimes(2)
      expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
      expect(commitBatchSpy).toHaveBeenCalledTimes(1)

      //中身のデータチェック
      for (const key in updateClipDocSpy.mock.calls) {
        if (
          Object.prototype.hasOwnProperty.call(updateClipDocSpy.mock.calls, key)
        ) {
          const [, clipDoc] = updateClipDocSpy.mock.calls[key]
          for (const [, clips] of clipDoc.clipsMap) {
            expect(clips.length).toBeGreaterThanOrEqual(100)
            clipElementCheck(clips)
            clipOrderCheck(clips)
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

      await updateEachPeriodsRankingLogic["getClipForEachStreamers"](streamer)

      //呼び出し回数チェック
      expect(getClipsSpy).toHaveBeenCalledTimes(2)
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
        updateEachPeriodsRankingLogic["getClipForEachStreamers"](streamer),
      ).rejects.toThrow()

      //呼び出し回数チェック
      expect(getClipsSpy).toHaveBeenCalledTimes(2)
      expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
      expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    }, 100000)
  })
})
