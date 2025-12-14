import assert from "assert"
import axios from "axios"
import fs from "fs"
import { describe } from "node:test"
import { MockedFunction } from "vitest"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { TwitchClipApi } from "../../../../src/apis/clip"
import { RANGE_DATE } from "../../../../src/constant"
import { updatePastRanking } from "../../../../src/firebase-functions/clip/updatePastRanking"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { Streamer } from "../../../../src/models/streamer"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import dayjs from "../../../../src/utils/dayjs"
import { clipElementCheck, clipOrderCheck } from "../checkFunctions"
import {
  generatePastClipDoc,
  generateStreamerClipDoc,
  getClipsSpyImp,
  getJSTDate,
} from "../spy"

vi.mock("axios")

describe("updatePastRankingのテスト", () => {
  const mockedAxios = axios as unknown as MockedFunction<typeof axios>

  beforeEach(async () => {
    const streamerRepository = new StreamerRepository()
    const clipRepository = new ClipRepository()
    //ストリーマー情報格納
    const streamers: Array<Streamer> = JSON.parse(
      fs.readFileSync("test/test_data/clip/streamer.json", "utf-8"),
    )
    await streamerRepository.updateStreamers(streamers)
    //ストリーマーのclip情報格納
    for (const streamer of streamers) {
      const id = streamer.id
      const created_at = streamer.created_at

      const clipDoc = generateStreamerClipDoc(id, new Date(created_at!))
      await clipRepository.updateClip(id, clipDoc)
    }
    //past_summary格納
    const clipDoc = generatePastClipDoc()
    await clipRepository.updateClip("past_summary", clipDoc)

    mockedAxios.mockResolvedValueOnce({
      data: {
        access_token: "test",
        expire_in: 0,
        token_type: "test",
      },
    })
  })

  afterEach(async () => {
    const streamerRepository = new StreamerRepository()
    const clipRepository = new ClipRepository()
    const ids = ["49207184", "545050196"]
    for (const id of ids) {
      await clipRepository.deleteClipDoc(id)
    }
    await clipRepository.deleteClipDoc("past_summary")
    await streamerRepository.updateStreamers([])
    mockedAxios.mockRestore()
    vi.restoreAllMocks()
  })

  test("更新", async () => {
    const getClipsSpy = vi
      .spyOn(TwitchClipApi.prototype, "getClips")
      .mockImplementation(getClipsSpyImp)

    const clipRepository = new ClipRepository()
    const streamerRepository = new StreamerRepository()
    const streamers = await streamerRepository.getStreamers()
    const oldClipDocs = new Map<string, ClipDoc>()

    for (const key in streamers) {
      const streamer = streamers[key]
      const clipDoc = await clipRepository.getClip(streamer.id)
      oldClipDocs.set(streamer.id, clipDoc)
    }
    await clipRepository.createClipDoc("past_summary")

    //実行
    await updatePastRanking()

    //呼び出し回数チェック
    const currentYear = new Date().getFullYear()
    const fiveYearsAgo = currentYear - RANGE_DATE.PastRangeYears
    const katoCreatedAt = 2020
    const shakaCreatedAt = 2013
    const calcCall = (createdAt: number) =>
      createdAt > fiveYearsAgo
        ? currentYear - createdAt
        : RANGE_DATE.PastRangeYears
    const expectCallGetClips =
      calcCall(katoCreatedAt) + calcCall(shakaCreatedAt)
    expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips)

    //各ストリーマーのクリップ
    for (const key in streamers) {
      const streamer = streamers[key]
      const clipDoc = await clipRepository.getClip(streamer.id)
      const oldClipDoc = oldClipDocs.get(streamer.id)
      assert(typeof oldClipDoc !== "undefined", "oldClipDoc is undefined")

      //各期間のクリップがあるか
      for (const [period, clips] of clipDoc.clipsMap) {
        if (
          period == "all" ||
          period == "day" ||
          period == "week" ||
          period == "month" ||
          period == "year"
        ) {
          break
        }
        expect(clips).toBeDefined()
        expect(clips.length).toEqual(100)
        clipElementCheck(clips)
        clipOrderCheck(clips)
        //過去５年になっているかの確認
        expect(parseInt(period)).toBeGreaterThanOrEqual(
          currentYear - RANGE_DATE.PastRangeYears,
        )
        expect(parseInt(period)).toBeLessThan(currentYear)

        //期間通りになっているかの確認
        const year = parseInt(period)
        const started_at = dayjs().set("year", year).tz().startOf("year")
        const ended_at = dayjs().set("year", year).tz().endOf("year")

        for (const clip of clips) {
          expect(clip.created_at).toBeDefined()

          expect(dayjs(clip.created_at).isAfter(started_at)).toBeTruthy()
          expect(dayjs(clip.created_at).isBefore(ended_at)).toBeTruthy()
        }

        clipDoc.clipsMap.delete(period)
        oldClipDoc.clipsMap.delete(period)
      }
      //ほかに影響を与えていないか,5年前以降は削除されているか
      for (
        let year = 2013;
        year < currentYear - RANGE_DATE.PastRangeYears;
        year++
      ) {
        oldClipDoc.clipsMap.delete(year.toString())
      }
      expect(clipDoc).toEqual(oldClipDoc)
    }
    //全体のランキング
    //todo: ５年以降のがある場合も削除されているかテストしたい
    const clipDoc = await clipRepository.getClip("past_summary")
    for (const [period, clips] of clipDoc.clipsMap) {
      expect(clips).toBeDefined()
      expect(clips.length).toEqual(100)
      clipElementCheck(clips)
      clipOrderCheck(clips)
      //過去５年以内になっているかの確認
      expect(parseInt(period)).toBeGreaterThanOrEqual(
        currentYear - RANGE_DATE.PastRangeYears,
      )
      expect(parseInt(period)).toBeLessThan(currentYear)

      const year = parseInt(period)
      const started_at = dayjs().set("year", year).tz().startOf("year")
      const ended_at = dayjs().set("year", year).tz().endOf("year")
      //  中身の要素確認
      for (const clip of clips) {
        if (!isNaN(Number(period))) {
          expect(clip.created_at).toBeDefined()

          expect(dayjs(clip.created_at).isAfter(started_at)).toBeTruthy()
          expect(dayjs(clip.created_at).isBefore(ended_at)).toBeTruthy()
        }
      }
    }
  }, 1000000)

  test("過去ランキングの削除テスト", async () => {
    const getClipsSpy = vi
      .spyOn(TwitchClipApi.prototype, "getClips")
      .mockImplementation(getClipsSpyImp)

    const clipRepository = new ClipRepository()
    //実行
    await updatePastRanking()

    const resultPastSummary = await clipRepository.getClip("past_summary")
    //要素数がRANGE_DATE.PastRangeYearsで指定した数とあっているか確認
    expect(resultPastSummary.clipsMap.size).toEqual(RANGE_DATE.PastRangeYears)

    //過去RANGE_DATE.PastRangeYearsで指定した年のランキングがあるか確認
    const currentDate = getJSTDate()
    const currentYear = currentDate.getFullYear()
    for (
      let index = currentYear - 1;
      index > currentYear - RANGE_DATE.PastRangeYears - 1;
      index--
    ) {
      const clips = resultPastSummary.clipsMap.get(`${index}`)
      expect(clips).toBeDefined()
    }

    //いらないかも
    expect(getClipsSpy).toHaveBeenCalled()
  })
})
