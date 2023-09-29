/* eslint-disable @typescript-eslint/no-unused-vars */
import assert from "assert"

import { faker } from "@faker-js/faker"
import axios from "axios"

import { TwitchClipApi } from "../../../../../src/apis/clip"
import { UpdateEachPeriodsRankingLogic } from "../../../../../src/firebase-functions/clip/updateEachPeriodsRanking/logic/updateEachPeriodsRankingLogic"
import { Clip } from "../../../../../src/models/clip"
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
            .mockImplementation(createClipsMock)
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
            .mockImplementation(createClipsMock)
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

async function createClipsMock(
    broadcaster_id: number,
    started_at?: Date,
    ended_at?: Date
) {
    assert(typeof started_at !== `undefined`)
    assert(typeof ended_at !== `undefined`)
    const display_name = faker.person.fullName()
    const clips: Array<Clip> = [...Array(100).keys()].map(
        (_) =>
            new Clip({
                embed_url: faker.internet.url(),
                broadcaster_id: broadcaster_id.toString(),
                created_at: faker.date
                    .between({
                        from: started_at,
                        to: ended_at
                    })
                    .toISOString(),
                language: `ja`,
                broadcaster_name: display_name,
                title: faker.lorem.sentence(3),
                thumbnail_url: faker.internet.url(),
                url: faker.internet.url(),
                duration: faker.number.float({ precision: 0.1 }),
                creator_id: faker.string.uuid(),
                creator_name: faker.person.fullName(),
                id: faker.string.uuid(),
                view_count: faker.number.int(),
                is_featured: faker.datatype.boolean(),
                video_id: ``,
                game_id: faker.string.numeric(10)
            })
    )
    return clips
}
