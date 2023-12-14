/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs"

import axios from "axios"

import { TwitchClipApi } from "../../../../src/apis/clip"
import { UpdatePastRankingLogic } from "../../../../src/firebase-functions/clip/updatePastRanking/updatePastRankingLogic"
import { Streamer } from "../../../../src/models/streamer"
import { BatchRepository } from "../../../../src/repositories/batch"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { clipElementCheck, clipOrderCheck } from "../checkFunctions"
import { getClipsSpyImp } from "../spy"

jest.mock(`axios`)

describe(`UpdatePastRankingLogicのテスト`, () => {
    let updatePastRankingLogic: UpdatePastRankingLogic
    const currentYear = new Date().getFullYear()
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
                token_type: `test`
            }
        })
        updatePastRankingLogic = await UpdatePastRankingLogic.init()
    })
    afterEach(() => {
        mockedAxios.mockRestore()
        jest.restoreAllMocks()
    })
    test(`getPeriodsのテスト`, async () => {
        const streamers: Array<Streamer> = JSON.parse(
            fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`)
        )
        for (const streamer of streamers) {
            const created_at = new Date(streamer!.created_at!)

            const periods = updatePastRankingLogic.getPeriods(streamer)

            expect(Object.keys(periods).length).toEqual(
                calcCall(created_at.getFullYear())
            )
            for (const key in periods) {
                const period = periods[key]
                const started_at = new Date(Number(key), 0, 1, 0, 0, 0)
                const ended_at = new Date(Number(key), 11, 31, 23, 59, 59)
                expect(period).toEqual({ started_at: started_at, ended_at: ended_at })
            }
        }
    })
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

        const streamers = await updatePastRankingLogic[`getStreamers`]()

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

        await expect(updatePastRankingLogic[`getStreamers`]()).rejects.toThrowError()
        expect(getStreamersSpy).toHaveBeenCalled()
    }, 100000)
    test(`getClipForEeachStreamersのテスト`, async () => {
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
            fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`)
        )

        await updatePastRankingLogic[`getClipForEeachStreamers`](streamer)

        //呼び出し回数チェック
        const katoCreatedAt = 2020
        const sekiCreatedAt = 2016
        const expectCallGetClips = calcCall(katoCreatedAt) + calcCall(sekiCreatedAt)
        expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips)
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)

        //中身のデータチェック
        for (const key in updateClipDocSpy.mock.calls) {
            if (Object.prototype.hasOwnProperty.call(updateClipDocSpy.mock.calls, key)) {
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

        const streamer: Array<Streamer> = JSON.parse(
            fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`)
        )

        await expect(
            updatePastRankingLogic[`getClipForEeachStreamers`](streamer)
        ).rejects.toThrowError()

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(1)
        expect(updateClipDocSpy).not.toHaveBeenCalled()
        expect(commitBatchSpy).not.toHaveBeenCalled()
    })
    test(`getClipForEeachStreamersのテスト:firestoreエラー`, async () => {
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
            fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`)
        )

        await expect(
            updatePastRankingLogic[`getClipForEeachStreamers`](streamer)
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
        await updatePastRankingLogic[`deleteOverLimitYear`]()
    })
})
