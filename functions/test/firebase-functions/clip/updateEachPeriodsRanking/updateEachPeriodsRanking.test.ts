import assert from "assert"
import fs from "fs"
import { describe } from "node:test"

import axios from "axios"
import * as functions from "firebase-functions"
import { WrappedScheduledFunction } from "firebase-functions-test/lib/main"

import {
    updateAllRanking,
    updateDayRanking,
    updateMonthRanking,
    updateWeekRanking,
    updateYearRanking
} from "../../../../src"
import { TwitchClipApi } from "../../../../src/apis/clip"
import { Clip } from "../../../../src/models/clip"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { Streamer } from "../../../../src/models/streamer"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { testEnv } from "../../../setUp"

import { getClipsSpyImp } from "./spy"

jest.mock(`axios`)
describe(`update***Rankingのテスト`, () => {
    const mockedAxios = axios as jest.MockedFunction<typeof axios>
    beforeAll(async () => {
        const streamerRepository = new StreamerRepository()
        const clipRepository = new ClipRepository()
        const ids = [`49207184`, `545050196`, `summary`]
        for (const id of ids) {
            const jsonObj = JSON.parse(
                fs.readFileSync(
                    `test/test_data/updateEachPeriodsRanking/oldClipDoc/${id}.json`,
                    `utf-8`
                )
            )
            const clipDoc = new ClipDoc()
            for (const period in jsonObj) {
                if (Object.prototype.hasOwnProperty.call(jsonObj, period)) {
                    const clips: Array<Clip> = []
                    for (const i in jsonObj[period]) {
                        if (Object.prototype.hasOwnProperty.call(jsonObj[period], i)) {
                            const clip = jsonObj[period][i] as Clip
                            clips.push(clip)
                        }
                    }
                    clipDoc.clipsMap.set(period, clips)
                }
            }
            await clipRepository.updateClip(id, clipDoc)
        }
        await streamerRepository.updateStreamers([
            new Streamer({
                broadcaster_type: `partner`,
                created_at: `2013-09-19T13:21:29Z`,
                description: ``,
                display_name: `fps_shaka`,
                id: `49207184`,
                login: `fps_shaka`,
                offline_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/282d883a-8e00-4fd3-88fa-bfcbd370c2cd-channel_offline_image-1920x1080.jpeg`,
                profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/61f568bf-884b-4126-b17c-fc525c6d3bd4-profile_image-300x300.png`,
                type: ``,
                view_count: 0
            }),
            new Streamer({
                broadcaster_type: `partner`,
                created_at: `2020-06-18T04:04:09Z`,
                description: `命尽き果てるまで`,
                display_name: `加藤純一です`,
                id: `545050196`,
                login: `kato_junichi0817`,
                offline_image_url: ``,
                profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/a4977cfd-1962-41ec-9355-ab2611b97552-profile_image-300x300.png`,
                type: ``,
                view_count: 0
            })
        ])
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
        await clipRepository.deleteClipDoc(`summary`)
        await clipRepository.createClipDoc(`summary`)
        await streamerRepository.updateStreamers([])
    })
    afterEach(() => jest.restoreAllMocks())
    test(`updateDayRanking`, async () => {
        await testOnePeriodFunction(updateDayRanking, `day`)
    }, 300000)
    test(`updateWeekRanking`, async () => {
        await testOnePeriodFunction(updateWeekRanking, `week`)
    }, 300000)
    test(`updateMonthRanking`, async () => {
        await testOnePeriodFunction(updateMonthRanking, `month`)
    }, 300000)
    test(`updateYearRanking`, async () => {
        await testOnePeriodFunction(updateYearRanking, `year`)
    }, 300000)
    test(`updateAllRanking`, async () => {
        await testOnePeriodFunction(updateAllRanking, `all`)
    }, 300000)
})

async function testOnePeriodFunction(
    cloudFunction: functions.CloudFunction<unknown>,
    period: string
) {
    const getClipsSpy = jest
        .spyOn(TwitchClipApi.prototype, `getClips`)
        .mockImplementation(getClipsSpyImp)
    const wrappedFunction: WrappedScheduledFunction = testEnv.wrap(cloudFunction)

    const streamerRepository = new StreamerRepository()
    const clipRepository = new ClipRepository()
    const streamers = await streamerRepository.getStreamers()
    const oldClipDocs = new Map<string, ClipDoc>()
    //準備 データを消す
    const initedClipDoc = new ClipDoc({
        clipsMap: new Map<string, Array<Clip>>([[period, []]])
    })
    for (const key in streamers) {
        const element = streamers[key]
        oldClipDocs.set(element.id, await clipRepository.getClip(element.id))
        await clipRepository.updateClip(element.id, initedClipDoc)
    }
    oldClipDocs.set(`summary`, await clipRepository.getClip(`summary`))
    await clipRepository.updateClip(`summary`, initedClipDoc)

    //実行
    await wrappedFunction()

    expect(getClipsSpy).toHaveBeenCalledTimes(2)
    //各ストリーマーのクリップ
    for (const key in streamers) {
        const streamer = streamers[key]
        await checkClipDoc(streamer.id, period, clipRepository, oldClipDocs)
    }
    //全体のランキング
    await checkClipDoc(`summary`, period, clipRepository, oldClipDocs)
}

async function checkClipDoc(
    id: string,
    period: string,
    clipRepository: ClipRepository,
    oldClipDocs: Map<string, ClipDoc>
) {
    const clipDoc = await clipRepository.getClip(id)

    //期間のクリップがあるか
    const clips = clipDoc.clipsMap.get(period)
    expect(typeof clips).not.toEqual(`undefined`)
    assert(typeof clips !== `undefined`, `clips is undefind`)

    expect(clips.length).toEqual(100)

    //  中身の要素確認
    for (const key_j in clips) {
        const clip = clips[key_j]
        expect(clip.title).toBeDefined()
        expect(clip.view_count).toBeDefined()
        expect(clip.created_at).toBeDefined()
        expect(clip.broadcaster_name).toBeDefined()
        expect(clip.embed_url).toBeDefined()
    }
    //順番チェック
    for (let index = 0; index < clips.length - 1; index++) {
        const currentClipViewConut = clips[index].view_count
        const nextClipViewCount = clips[index + 1].view_count
        const message = `clips.view_count is undefind`
        expect(typeof currentClipViewConut).toEqual(`number`)
        expect(typeof nextClipViewCount).toEqual(`number`)
        assert(typeof currentClipViewConut === `number`, message)
        assert(typeof nextClipViewCount === `number`, message)
        expect(currentClipViewConut).toBeGreaterThanOrEqual(nextClipViewCount)
    }
    //all以外に影響を与えていないか
    clipDoc.clipsMap.delete(period)
    const oldClipDoc = oldClipDocs.get(id)
    assert(typeof oldClipDoc !== `undefined`, `oldClipDoc is undefined`)
    oldClipDoc.clipsMap.delete(period)
    expect(clipDoc).toEqual(oldClipDoc)
}
