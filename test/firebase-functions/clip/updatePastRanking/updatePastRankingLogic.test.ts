import axios from "axios"
/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs"

import { TwitchClipApi } from "../../../../src/apis/clip"
import { UpdatePastRankingLogic } from "../../../../src/firebase-functions/clip/updatePastRanking/updatePastRankingLogic"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { Streamer } from "../../../../src/models/streamer"
import { BatchRepository } from "../../../../src/repositories/batch"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { clipElementCheck, clipOrderCheck } from "../checkFunctions"
import { getClipsSpyImp, getJSTDate } from "../spy"

jest.mock(`axios`)

describe(`UpdatePastRankingLogicのテスト`, () => {
  let updatePastRankingLogic: UpdatePastRankingLogic
  const currentYear = getJSTDate().getFullYear()
  const pastYear = 5 //何年前までとるか
  const fiveYearsAgo = currentYear - pastYear
  const calcCall = (createdAt: number) =>
    createdAt > fiveYearsAgo ? currentYear - createdAt : pastYear
  const mockedAxios = axios as jest.MockedFunction<typeof axios>

  beforeAll(async () => {
    mockedAxios.mockResolvedValueOnce({
      data: {
        access_token: `test`,
        expire_in: 0,
        token_type: `test`,
      },
    })
    updatePastRankingLogic = await UpdatePastRankingLogic.init()
  })
  afterEach(() => {
    mockedAxios.mockRestore()
    jest.restoreAllMocks()
  })
  test(`getPeriodsのテスト`, async () => {
    const streamers: Array<Streamer> = JSON.parse(
      fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`),
    )
    for (const streamer of streamers) {
      const created_at = new Date(streamer!.created_at!)

      const periods = updatePastRankingLogic.getPeriods(streamer)

      expect(Object.keys(periods).length).toEqual(
        calcCall(created_at.getFullYear()),
      )
      for (const key in periods) {
        const period = periods[key]
        const started_at = new Date(Number(key) - 1, 11, 31, 15, 0, 0)
        const ended_at = new Date(Number(key), 11, 31, 14, 59, 59, 999)
        expect({
          ended_at: period.ended_at?.toDate(),
          started_at: period.started_at?.toDate(),
        }).toEqual({
          ended_at: ended_at,
          started_at: started_at,
        })
      }
    }
  })
  test(`getStreamersのテスト`, async () => {
    const getStreamersSpy = jest
      .spyOn(StreamerRepository.prototype, `getStreamers`)
      .mockResolvedValue([
        new Streamer({
          follower_num: 100,
          id: `49207184`,
        }),
        new Streamer({
          follower_num: 200,
          id: `545050196`,
        }),
      ])

    const streamers = await updatePastRankingLogic[`getStreamers`]()

    expect(getStreamersSpy).toHaveBeenCalled()
    expect(streamers).toEqual([
      new Streamer({
        follower_num: 100,
        id: `49207184`,
      }),
      new Streamer({
        follower_num: 200,
        id: `545050196`,
      }),
    ])
  }, 100000)
  test(`getStreamersのテスト:firestoreエラー`, async () => {
    const getStreamersSpy = jest
      .spyOn(StreamerRepository.prototype, `getStreamers`)
      .mockRejectedValueOnce(new Error(`firestore error test`))

    await expect(
      updatePastRankingLogic[`getStreamers`](),
    ).rejects.toThrowError()
    expect(getStreamersSpy).toHaveBeenCalled()
  }, 100000)
  test(`getClipForEachStreamersのテスト`, async () => {
    const getClipsSpy = jest
      .spyOn(TwitchClipApi.prototype, `getClips`)
      .mockImplementation(getClipsSpyImp)
    const updateClipDocSpy = jest
      .spyOn(ClipRepository.prototype, `batchUpdateClip`)
      .mockImplementation()
    const commitBatchSpy = jest
      .spyOn(BatchRepository.prototype, `commitBatch`)
      .mockResolvedValue()

    const streamer: Array<Streamer> = JSON.parse(
      fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`),
    )

    await updatePastRankingLogic[`getClipForEachStreamers`](streamer)

    //呼び出し回数チェック
    const katoCreatedAt = 2020
    const sekiCreatedAt = 2016
    const expectCallGetClips = calcCall(katoCreatedAt) + calcCall(sekiCreatedAt)
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
        for (const [_, clips] of args[1].clipsMap) {
          expect(clips.length).toEqual(100)
          clipOrderCheck(clips)
          clipElementCheck(clips)
        }
      }
    }
  }, 100000)
  test(`getClipForEachStreamersのテスト:axiosエラー`, async () => {
    const getClipsSpy = jest
      .spyOn(TwitchClipApi.prototype, `getClips`)
      .mockRejectedValue(new Error(`axios error test`))
    const updateClipDocSpy = jest
      .spyOn(ClipRepository.prototype, `batchUpdateClip`)
      .mockImplementation()
    const commitBatchSpy = jest
      .spyOn(BatchRepository.prototype, `commitBatch`)
      .mockResolvedValue()

    const streamer: Array<Streamer> = JSON.parse(
      fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`),
    )

    await expect(
      updatePastRankingLogic[`getClipForEachStreamers`](streamer),
    ).rejects.toThrowError()

    //呼び出し回数チェック
    expect(getClipsSpy).toHaveBeenCalledTimes(1)
    expect(updateClipDocSpy).not.toHaveBeenCalled()
    expect(commitBatchSpy).not.toHaveBeenCalled()
  })
  test(`getClipForEachStreamersのテスト:firestoreエラー`, async () => {
    const getClipsSpy = jest
      .spyOn(TwitchClipApi.prototype, `getClips`)
      .mockImplementation(getClipsSpyImp)
    const updateClipDocSpy = jest
      .spyOn(ClipRepository.prototype, `batchUpdateClip`)
      .mockImplementation()
    const commitBatchSpy = jest
      .spyOn(BatchRepository.prototype, `commitBatch`)
      .mockRejectedValue(new Error(`batch commit error test`))

    const streamer: Array<Streamer> = JSON.parse(
      fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`),
    )

    await expect(
      updatePastRankingLogic[`getClipForEachStreamers`](streamer),
    ).rejects.toThrowError()

    //呼び出し回数チェック
    const katoCreatedAt = 2020
    const sekiCreatedAt = 2016
    const expectCallGetClips = calcCall(katoCreatedAt) + calcCall(sekiCreatedAt)
    expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips)
    expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
    expect(commitBatchSpy).toHaveBeenCalledTimes(1)
  })
  test(`deleteOverLimitYearのテスト`, async () => {
    //何年かこのものまで格納する想定か設定する
    //ここで制限はみ出している年のものが削除される
    const setAgo = 7
    const getStreamersSpy = jest
      .spyOn(StreamerRepository.prototype, `getStreamers`)
      .mockResolvedValue([
        new Streamer({
          created_at: new Date(currentYear - setAgo, 1, 1).toISOString(),
          follower_num: 100,
          id: `49207184`,
        }),
        new Streamer({
          created_at: new Date(currentYear, 1, 1).toISOString(),
          follower_num: 200,
          id: `545050196`,
        }),
      ])
    const getClipSpy = jest
      .spyOn(ClipRepository.prototype, `getClip`)
      .mockImplementation(async (clipId: string) => {
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
    const batchDeleteFieldValueSpy = jest
      .spyOn(ClipRepository.prototype, `batchDeleteFieldValue`)
      .mockImplementation()
    const commitBatchSpy = jest
      .spyOn(BatchRepository.prototype, `commitBatch`)
      .mockResolvedValue()

    await updatePastRankingLogic[`deleteOverLimitYear`]()

    expect(getStreamersSpy).toHaveBeenCalledTimes(1)
    //past_summaryとストリーマー一人分で2倍呼ばれる
    expect(batchDeleteFieldValueSpy).toHaveBeenCalledTimes(
      (setAgo - pastYear) * 2,
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
