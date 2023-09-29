/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "assert"

import axios from "axios"

import { TwitchClipApi } from "../../../../../src/apis/clip"
import { UpdateOnePeriodRanking } from "../../../../../src/firebase-functions/clip/updateEachPeriodsRanking/logic/UpdateOnePeriodRanking"
import { Streamer } from "../../../../../src/models/streamer"
import { BatchRepository } from "../../../../../src/repositories/batch"
import { ClipRepository } from "../../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../../src/repositories/streamer"
import { getClipsSpyImp } from "../spy"

jest.mock(`axios`)

describe(`UpdateOnePeriodRankingのテスト`, () => {
    beforeEach(async () => {
        const mockedAxios = axios as jest.MockedFunction<typeof axios>
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`
            }
        })
    })
    afterEach(() => jest.restoreAllMocks())
    test(`dayランキング更新テスト`, async () => {
        await eachPeriods(`day`, 1)
    })
    test(`weekランキング更新テスト`, async () => {
        await eachPeriods(`week`, 7)
    })
    test(`monthランキング更新テスト`, async () => {
        await eachPeriods(`month`, 30)
    })
    test(`yearランキング更新テスト`, async () => {
        await eachPeriods(`year`, 365)
    })
    test(`allランキング更新テスト`, async () => {
        await eachPeriods(`all`)
    })
})

async function eachPeriods(period: string, days?: number) {
    //準備
    const getStreamersSpy = jest
        .spyOn(StreamerRepository.prototype, `getStreamers`)
        .mockResolvedValue([
            new Streamer({
                id: `49207184`,
                follower_num: 100
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 200
            })
        ])

    const getClipsSpy = jest
        .spyOn(TwitchClipApi.prototype, `getClips`)
        .mockImplementation(getClipsSpyImp)
    const updateClipDocSpy = jest
        .spyOn(ClipRepository.prototype, `batchUpdateClip`)
        .mockImplementation()
    const commitBatchSpy = jest
        .spyOn(BatchRepository.prototype, `commitBatch`)
        .mockResolvedValue()

    //実行
    const updateOnehPeriodRanking = new UpdateOnePeriodRanking(period, days)
    await expect(updateOnehPeriodRanking.run()).resolves.not.toThrowError()

    //test
    expect(getStreamersSpy).toHaveBeenCalledTimes(1)
    expect(getClipsSpy).toHaveBeenCalledTimes(2)
    expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
    expect(commitBatchSpy).toHaveBeenCalledTimes(1)

    //中身のデータチェック
    for (const key in updateClipDocSpy.mock.calls) {
        if (Object.prototype.hasOwnProperty.call(updateClipDocSpy.mock.calls, key)) {
            const [, clipDoc] = updateClipDocSpy.mock.calls[key]
            //順番チェック
            for (const [, clips] of clipDoc.clipsMap) {
                expect(clips.length).toBeGreaterThanOrEqual(100)
                for (let index = 0; index < clips.length - 1; index++) {
                    const currentClipViewConut = clips[index].view_count
                    const nextClipViewCount = clips[index + 1].view_count
                    expect(typeof currentClipViewConut).toEqual(`number`)
                    expect(typeof nextClipViewCount).toEqual(`number`)
                    assert(typeof currentClipViewConut === `number`)
                    assert(typeof nextClipViewCount === `number`)
                    expect(currentClipViewConut).toBeGreaterThanOrEqual(nextClipViewCount)
                }
            }
        }
    }
}
