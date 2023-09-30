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
    beforeAll(async () => {
        const mockedAxios = axios as jest.MockedFunction<typeof axios>
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`
            }
        })
        updatePastRankingLogic = await UpdatePastRankingLogic.init()
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

        const streamers = await updatePastRankingLogic.getStreamers()

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

        await expect(updatePastRankingLogic.getStreamers()).rejects.toThrowError()
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

        await updatePastRankingLogic.getClipForEeachStreamers(streamer)

        //呼び出し回数チェック
        const currentYear = new Date().getFullYear()
        const expectCallGetClips = currentYear - 2016 + (currentYear - 2020)
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
            updatePastRankingLogic.getClipForEeachStreamers(streamer)
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
            updatePastRankingLogic.getClipForEeachStreamers(streamer)
        ).rejects.toThrowError()

        //呼び出し回数チェック
        const currentYear = new Date().getFullYear()
        const expectCallGetClips = currentYear - 2016 + (currentYear - 2020)
        expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips)
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    })
})
