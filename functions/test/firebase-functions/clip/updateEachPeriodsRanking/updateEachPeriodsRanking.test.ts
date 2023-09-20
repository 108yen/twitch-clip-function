/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "assert"
import fs from "fs"

import axios from "axios"

import { TwitchClipApi } from "../../../../src/apis/clip"
import { UpdateOnePeriodRanking } from "../../../../src/firebase-functions/clip/updateEachPeriodsRanking/updateEachPeriodsRanking"
import { Clip } from "../../../../src/models/clip"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { Streamer } from "../../../../src/models/streamer"
import { BatchRepository } from "../../../../src/repositories/batch"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"

jest.mock(`axios`)

describe(`UpdateEachPeriodsRankingのテスト`, () => {
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
        await eachPeriods("day", 1)
    })
    test(`weekランキング更新テスト`, async () => {
        await eachPeriods("week", 7)
    })
    test(`monthランキング更新テスト`, async () => {
        await eachPeriods("month", 30)
    })
    test(`yearランキング更新テスト`, async () => {
        await eachPeriods("year", 365)
    })
    test(`allランキング更新テスト`, async () => {
        await eachPeriods("all")
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
        .mockImplementation(
            async (
                broadcaster_id: number,
                started_at?: Date,
                _ended_at?: Date
            ) => {
                const jsonObj = JSON.parse(
                    fs.readFileSync(
                        `data/clipDoc/${broadcaster_id}.json`,
                        `utf-8`
                    )
                )
                const result = new ClipDoc()
                for (const i in jsonObj) {
                    const clips: Array<Clip> = []
                    for (const j in jsonObj[i]) {
                        const element = jsonObj[i][j] as Clip
                        clips.push(element)
                    }
                    //シャッフル
                    // clips.sort((a, b) => 0.5 - Math.random());
                    result.clipsMap.set(i, clips)
                }

                const clips = result.clipsMap.get(period)
                assert(typeof clips !== `undefined`, `clips is undefind`)
                return clips
            }
        )
    const updateClipDocSpy = jest
        .spyOn(ClipRepository.prototype, `batchUpdateClip`)
        .mockImplementation()
    const commitBatchSpy = jest
        .spyOn(BatchRepository.prototype, `commitBatch`)
        .mockResolvedValue()

    //実行
    const updateEachPeriodsRanking = new UpdateOnePeriodRanking(period, days)
    await expect(updateEachPeriodsRanking.run()).resolves.not.toThrowError()

    //test
    expect(getStreamersSpy).toHaveBeenCalledTimes(1)
    expect(getClipsSpy).toHaveBeenCalledTimes(2)
    expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
    expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    for (const args of updateClipDocSpy.mock.calls) {
        const [clipId, clipDoc] = args
        const jsonObj = JSON.parse(
            fs.readFileSync(`data/clipDoc/${clipId}.json`, `utf-8`)
        )
        const clips: Array<Clip> = []
        for (const j in jsonObj[period]) {
            const clip = jsonObj[period][j] as Clip
            clips.push(clip)
        }
        const result = new ClipDoc({ clipsMap: new Map([[period, clips]]) })
        expect(clipDoc).toEqual(result)
    }
}
