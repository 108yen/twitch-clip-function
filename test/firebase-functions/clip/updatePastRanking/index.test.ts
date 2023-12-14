import assert from "assert"
import fs from "fs"
import { describe } from "node:test"

import axios from "axios"

import { TwitchClipApi } from "../../../../src/apis/clip"
import { updatePastRanking } from "../../../../src/firebase-functions/clip/updatePastRanking"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { Streamer } from "../../../../src/models/streamer"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { clipElementCheck, clipOrderCheck } from "../checkFunctions"
import { generatePastClipDoc, generateStreamerClipDoc, getClipsSpyImp } from "../spy"

jest.mock(`axios`)

describe(`updatePastRankingのテスト`, () => {
    const mockedAxios = axios as jest.MockedFunction<typeof axios>
    const pastYear = 5 //何年前までとるか
    beforeAll(async () => {
        const streamerRepository = new StreamerRepository()
        const clipRepository = new ClipRepository()
        //ストリーマー情報格納
        const streamers: Array<Streamer> = JSON.parse(
            fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`)
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
        await clipRepository.updateClip(`past_summary`, clipDoc)
    })
    beforeEach(() => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`
            }
        })
    })
    afterAll(async () => {
        const streamerRepository = new StreamerRepository()
        const clipRepository = new ClipRepository()
        const ids = [`49207184`, `545050196`]
        for (const id of ids) {
            await clipRepository.deleteClipDoc(id)
        }
        await clipRepository.deleteClipDoc(`past_summary`)
        await streamerRepository.updateStreamers([])
    })
    afterEach(() => {
        mockedAxios.mockRestore()
        jest.restoreAllMocks()
    })

    test(`更新`, async () => {
        const getClipsSpy = jest
            .spyOn(TwitchClipApi.prototype, `getClips`)
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
        await clipRepository.createClipDoc(`past_summary`)

        //実行
        await updatePastRanking()

        //呼び出し回数チェック
        const currentYear = new Date().getFullYear()
        const fiveYearsAgo = currentYear - pastYear
        const katoCreatedAt = 2020
        const shakaCreatedAt = 2013
        const calcCall = (createdAt: number) =>
            createdAt > fiveYearsAgo ? currentYear - createdAt : pastYear
        const expectCallGetClips = calcCall(katoCreatedAt) + calcCall(shakaCreatedAt)
        expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips)

        //各ストリーマーのクリップ
        for (const key in streamers) {
            const streamer = streamers[key]
            const clipDoc = await clipRepository.getClip(streamer.id)
            const oldClipDoc = oldClipDocs.get(streamer.id)
            assert(typeof oldClipDoc !== `undefined`, `oldClipDoc is undefined`)

            //各期間のクリップがあるか
            for (const [period, clips] of clipDoc.clipsMap) {
                if (
                    period == `all` ||
                    period == `day` ||
                    period == `week` ||
                    period == `month` ||
                    period == `year`
                ) {
                    break
                }
                expect(clips).toBeDefined()
                expect(clips.length).toEqual(100)
                clipElementCheck(clips)
                clipOrderCheck(clips)
                //過去５年になっているかの確認
                expect(parseInt(period)).toBeGreaterThanOrEqual(currentYear - pastYear)
                expect(parseInt(period)).toBeLessThan(currentYear)

                //期間通りになっているかの確認
                for (const key_j in clips) {
                    const clip = clips[key_j]
                    const year = parseInt(period)
                    const started_at = new Date(year - 1, 11, 31, 15, 0, 0)
                    const ended_at = new Date(year, 11, 31, 14, 59, 59)
                    assert(
                        typeof clip.created_at !== `undefined`,
                        `created_at is undefined`
                    )
                    expect(new Date(clip.created_at).getTime()).toBeGreaterThanOrEqual(
                        started_at.getTime()
                    )
                    expect(new Date(clip.created_at).getTime()).toBeLessThanOrEqual(
                        ended_at.getTime()
                    )
                }
                clipDoc.clipsMap.delete(period)
                oldClipDoc.clipsMap.delete(period)
            }
            //ほかに影響を与えていないか,5年前以降は削除されているか
            for (let year = 2013; year < currentYear - pastYear; year++) {
                oldClipDoc.clipsMap.delete(year.toString())
            }
            expect(clipDoc).toEqual(oldClipDoc)
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`past_summary`)
        for (const [period, clips] of clipDoc.clipsMap) {
            expect(clips).toBeDefined()
            expect(clips.length).toEqual(100)
            clipElementCheck(clips)
            clipOrderCheck(clips)
            //過去５年以内になっているかの確認
            expect(parseInt(period)).toBeGreaterThanOrEqual(currentYear - pastYear)
            expect(parseInt(period)).toBeLessThan(currentYear)
            //  中身の要素確認
            for (const key_j in clips) {
                const clip = clips[key_j]
                if (!isNaN(Number(period))) {
                    const year = parseInt(period)
                    const started_at = new Date(year - 1, 11, 31, 15, 0, 0)
                    const ended_at = new Date(year, 11, 31, 14, 59, 59)
                    assert(
                        typeof clip.created_at !== `undefined`,
                        `created_at is undefined`
                    )
                    expect(new Date(clip.created_at).getTime()).toBeGreaterThanOrEqual(
                        started_at.getTime()
                    )
                    expect(new Date(clip.created_at).getTime()).toBeLessThanOrEqual(
                        ended_at.getTime()
                    )
                }
            }
        }
    }, 1000000)
})
