/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs"

import axios from "axios"

import { TwitchClipApi } from "../../../../../src/apis/clip"
import { UpdateEachPeriodsRankingLogic } from "../../../../../src/firebase-functions/clip/updateEachPeriodsRanking/logic/updateEachPeriodsRankingLogic"
import { Streamer } from "../../../../../src/models/streamer"
import { BatchRepository } from "../../../../../src/repositories/batch"
import { ClipRepository } from "../../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../../src/repositories/streamer"
import { clipElementCheck, clipOrderCheck } from "../../checkFunctions"
import { getClipsSpyImp } from "../../spy"

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
        updateEachPeriodsRankingLogic = await UpdateEachPeriodsRankingLogic.init(`day`, 1)
    })
    afterEach(() => jest.restoreAllMocks())
    test(`getPeriodsのテスト`, () => {
        const periods = updateEachPeriodsRankingLogic.getPeriods(new Streamer())

        expect(typeof periods[`day`].started_at).toBeDefined()
        expect(typeof periods[`day`].ended_at).toBeDefined()
        expect(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            periods[`day`].ended_at!.unix() - periods[`day`].started_at!.unix()
        ).toEqual(24 * 60 * 60 * 1000)
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

        const streamers = await updateEachPeriodsRankingLogic[`getStreamers`]()

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

        await expect(
            updateEachPeriodsRankingLogic[`getStreamers`]()
        ).rejects.toThrowError()
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

        await updateEachPeriodsRankingLogic[`getClipForEeachStreamers`](streamer)

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(2)
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)

        //中身のデータチェック
        for (const key in updateClipDocSpy.mock.calls) {
            if (Object.prototype.hasOwnProperty.call(updateClipDocSpy.mock.calls, key)) {
                const [, clipDoc] = updateClipDocSpy.mock.calls[key]
                for (const [, clips] of clipDoc.clipsMap) {
                    expect(clips.length).toBeGreaterThanOrEqual(100)
                    clipElementCheck(clips)
                    clipOrderCheck(clips)
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
            updateEachPeriodsRankingLogic[`getClipForEeachStreamers`](streamer)
        ).rejects.toThrowError()

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(1)
        expect(updateClipDocSpy).not.toHaveBeenCalled()
        expect(commitBatchSpy).not.toHaveBeenCalled()
    }, 100000)
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
            updateEachPeriodsRankingLogic[`getClipForEeachStreamers`](streamer)
        ).rejects.toThrowError()

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(2)
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    }, 100000)
})
