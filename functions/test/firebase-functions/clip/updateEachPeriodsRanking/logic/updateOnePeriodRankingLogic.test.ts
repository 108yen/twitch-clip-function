/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "assert"
import fs from "fs"

import axios from "axios"

import { TwitchClipApi } from "../../../../../src/apis/clip"
import { UpdateEachPeriodsRankingLogic } from "../../../../../src/firebase-functions/clip/updateEachPeriodsRanking/logic/updateEachPeriodsRankingLogic"
import { Clip } from "../../../../../src/models/clip"
import { ClipDoc } from "../../../../../src/models/clipDoc"
import { Streamer } from "../../../../../src/models/streamer"
import { BatchRepository } from "../../../../../src/repositories/batch"
import { ClipRepository } from "../../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../../src/repositories/streamer"

jest.mock(`axios`)

describe(`UpdateEachPeriodsRankingLogicのテスト`, () => {
    let updateEachPeriodsRankingLogic: UpdateEachPeriodsRankingLogic
    beforeAll(async () => {
        const mockedAxios = axios as jest.MockedFunction<typeof axios>
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`
            }
        })
        const today = new Date()
        function daysAgo(day: number) {
            const today = new Date()
            return new Date(today.getTime() - day * 24 * 60 * 60 * 1000)
        }
        const periods = {
            day: { started_at: daysAgo(1), ended_at: today },
            week: { started_at: daysAgo(7), ended_at: today },
            month: { started_at: daysAgo(30), ended_at: today },
            year: { started_at: daysAgo(365), ended_at: today }
        }
        updateEachPeriodsRankingLogic = await UpdateEachPeriodsRankingLogic.init(periods)
    })
    afterEach(() => jest.restoreAllMocks())
    test(`getStreamersのテスト`, async () => {
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

        const streamers = await updateEachPeriodsRankingLogic.getStreamers()

        expect(getStreamersSpy).toHaveBeenCalled()
        expect(streamers).toEqual([
            new Streamer({
                id: `49207184`,
                follower_num: 100
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 200
            })
        ])
    }, 100000)
    test(`getStreamersのテスト:firestoreエラー`, async () => {
        const getStreamersSpy = jest
            .spyOn(StreamerRepository.prototype, `getStreamers`)
            .mockRejectedValueOnce(new Error(`firestore error test`))

        await expect(updateEachPeriodsRankingLogic.getStreamers()).rejects.toThrowError()
        expect(getStreamersSpy).toHaveBeenCalled()
    }, 100000)
    test(`getClipForEeachStreamersのテスト`, async () => {
        const getClipsSpy = jest
            .spyOn(TwitchClipApi.prototype, `getClips`)
            .mockImplementation(
                async (broadcaster_id: number, started_at?: Date, _ended_at?: Date) => {
                    const jsonObj = JSON.parse(
                        fs.readFileSync(`data/clipDoc/${broadcaster_id}.json`, `utf-8`)
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
                    const today = new Date()
                    const day = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
                    const week = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000)
                    const month = new Date(today.getTime() - 31 * 24 * 60 * 60 * 1000)
                    assert(typeof started_at !== `undefined`, `started_at is undefind`)
                    let clips: Array<Clip> | undefined
                    if (started_at.getTime() > day.getTime()) {
                        clips = result.clipsMap.get(`day`)
                    } else if (started_at.getTime() > week.getTime()) {
                        clips = result.clipsMap.get(`week`)
                    } else if (started_at.getTime() > month.getTime()) {
                        clips = result.clipsMap.get(`month`)
                    } else {
                        clips = result.clipsMap.get(`year`)
                    }
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

        const streamer = [
            new Streamer({ id: `49207184` }), 
            new Streamer({ id: `545050196` })
        ]

        await updateEachPeriodsRankingLogic.getClipForEeachStreamers(streamer)

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(8)
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)

        //中身のデータチェック
        for (const key in updateClipDocSpy.mock.calls) {
            if (Object.prototype.hasOwnProperty.call(updateClipDocSpy.mock.calls, key)) {
                const args = updateClipDocSpy.mock.calls[key]
                const checkPeriods = [
                    `day`, //
                    `week`,
                    `month`,
                    `year`
                ]
                // !debug summaryのモックデータ作成
                // if (args[0] == `summary`) {
                //     console.debug(`summary called`);

                //     const clipDoc = new ClipDoc();
                //     const summaryjson = JSON.parse(fs.readFileSync(`data/clipDoc/summary.json`, `utf-8`));
                //     for (const i in summaryjson) {
                //         const clips: Array<Clip> = [];
                //         for (const j in summaryjson[i]) {
                //             const element = summaryjson[i][j] as Clip;
                //             clips.push(element);
                //         }
                //         clipDoc.clipsMap.set(
                //             i,
                //             clips
                //         )
                //     }
                //     for (const key in checkPeriods) {
                //         if (Object.prototype.hasOwnProperty.call(checkPeriods, key)) {
                //             const period = checkPeriods[key];
                //             clipDoc.clipsMap.set(
                //                 period,
                //                 args[1].clipsMap.get(period)!
                //             )
                //         }
                //     }

                //     const json = JSON.stringify(Object.fromEntries(clipDoc.clipsMap.entries()));
                //     fs.writeFileSync(`data/clipDoc/summary.json`, json);
                //     break;
                // }

                const jsonObj = JSON.parse(
                    fs.readFileSync(`data/clipDoc/${args[0]}.json`, `utf-8`)
                )
                const result = new ClipDoc()
                for (const key in checkPeriods) {
                    const period = checkPeriods[key]

                    const clips: Array<Clip> = []
                    for (const j in jsonObj[period]) {
                        const clip = jsonObj[period][j] as Clip
                        clips.push(clip)
                    }
                    result.clipsMap.set(period, clips)
                }

                expect(args[1]).toEqual(result)
                //順番チェック
                for (const [period, clips] of args[1].clipsMap) {
                    //数は安定しない
                    if (period == `day`) {
                        expect(clips.length).toBeGreaterThanOrEqual(52)
                    } else if (period == `week`) {
                        expect(clips.length).toBeGreaterThanOrEqual(84)
                    } else {
                        expect(clips.length).toBeGreaterThanOrEqual(93)
                    }
                    for (let index = 0; index < clips.length - 1; index++) {
                        const currentClipViewConut = clips[index].view_count
                        const nextClipViewCount = clips[index + 1].view_count
                        const message = `clips.view_count is undefind`
                        assert(typeof currentClipViewConut === `number`, message)
                        assert(typeof nextClipViewCount === `number`, message)
                        expect(currentClipViewConut).toBeGreaterThanOrEqual(
                            nextClipViewCount
                        )
                    }
                }
            }
        }
    }, 100000)
    test(`getClipForEeachStreamersのテスト:axiosエラー`, async () => {
        const getClipsSpy = jest
            .spyOn(TwitchClipApi.prototype, `getClips`)
            .mockRejectedValue(new Error(`axios error test`))
        const updateClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchUpdateClip`)
            .mockImplementation()
        const commitBatchSpy = jest
            .spyOn(BatchRepository.prototype, `commitBatch`)
            .mockResolvedValue()

        const streamer = [
            new Streamer({ id: `49207184` }),
            new Streamer({ id: `545050196` })
        ]

        await expect(
            updateEachPeriodsRankingLogic.getClipForEeachStreamers(streamer)
        ).rejects.toThrowError()

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(1)
        expect(updateClipDocSpy).not.toHaveBeenCalled()
        expect(commitBatchSpy).not.toHaveBeenCalled()
    }, 100000)
    test(`getClipForEeachStreamersのテスト:firestoreエラー`, async () => {
        const getClipsSpy = jest
            .spyOn(TwitchClipApi.prototype, `getClips`)
            .mockImplementation(
                async (broadcaster_id: number, started_at?: Date, _ended_at?: Date) => {
                    const jsonObj = JSON.parse(
                        fs.readFileSync(`data/clipDoc/${broadcaster_id}.json`, `utf-8`)
                    )
                    const result = new ClipDoc()
                    for (const i in jsonObj) {
                        const clips: Array<Clip> = []
                        for (const j in jsonObj[i]) {
                            const element = jsonObj[i][j] as Clip
                            clips.push(element)
                        }
                        result.clipsMap.set(i, clips)
                    }
                    const today = new Date()
                    const day = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)
                    const week = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000)
                    const month = new Date(today.getTime() - 31 * 24 * 60 * 60 * 1000)
                    assert(typeof started_at !== `undefined`, `started_at is undefind`)
                    let clips: Array<Clip> | undefined
                    if (started_at.getTime() > day.getTime()) {
                        clips = result.clipsMap.get(`day`)
                    } else if (started_at.getTime() > week.getTime()) {
                        clips = result.clipsMap.get(`week`)
                    } else if (started_at.getTime() > month.getTime()) {
                        clips = result.clipsMap.get(`month`)
                    } else {
                        clips = result.clipsMap.get(`year`)
                    }
                    assert(typeof clips !== `undefined`, `clips is undefind`)
                    return clips
                }
            )
        const updateClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchUpdateClip`)
            .mockImplementation()
        const commitBatchSpy = jest
            .spyOn(BatchRepository.prototype, `commitBatch`)
            .mockRejectedValue(new Error(`batch commit error test`))

        const streamer = [
            new Streamer({ id: `49207184` }),
            new Streamer({ id: `545050196` })
        ]

        await expect(
            updateEachPeriodsRankingLogic.getClipForEeachStreamers(streamer)
        ).rejects.toThrowError()

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(8)
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    }, 100000)
})
