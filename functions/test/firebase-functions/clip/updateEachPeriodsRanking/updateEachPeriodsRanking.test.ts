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
import { clipElementCheck, clipOrderCheck } from "../checkFunctions"
import { createDailyDammyData, getClipsSpyImp } from "../spy"

jest.mock(`axios`)

describe(`update***Rankingのテスト`, () => {
    const mockedAxios = axios as jest.MockedFunction<typeof axios>
    beforeAll(async () => {
        const streamerRepository = new StreamerRepository()
        const clipRepository = new ClipRepository()
        const ids = [`49207184`, `545050196`, `summary`]
        for (const id of ids) {
            const jsonObj = JSON.parse(
                fs.readFileSync(`test/test_data/clip/oldClipDoc/${id}.json`, `utf-8`)
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
        const streamers: Array<Streamer> = JSON.parse(
            fs.readFileSync(`test/test_data/clip/streamer.json`, `utf-8`)
        )
        await streamerRepository.updateStreamers(streamers)

        const dailyClipDoc = await createDailyDammyData()
        await clipRepository.updateClip(`daily`, dailyClipDoc)
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
        await clipRepository.deleteClipDoc(`daily`)
    })
    afterEach(() => jest.restoreAllMocks())
    test(`updateDayRanking（Dailyランキングの更新もやる）`, async () => {
        await testOnePeriodFunction(updateDayRanking, `day`)
        await checkDailyClipDoc()
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

async function checkDailyClipDoc() {
    const clipRepository = new ClipRepository()
    const dailyClipDoc = await clipRepository.getClip(`daily`)
    const today = new Date()
    const expectedKeys = [...Array(7).keys()].map((index) => {
        const started_at = new Date(today.getTime() - (index + 1) * 24 * 60 * 60 * 1000)
        return `${started_at.getMonth() + 1}/${started_at.getDate()}`
    })
    expect(Array.from(dailyClipDoc.clipsMap.keys()).sort()).toEqual(expectedKeys.sort())
    for (const [, clips] of dailyClipDoc.clipsMap) {
        clipOrderCheck(clips)
        clipElementCheck(clips)
    }
}

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

    //  中身の要素,順番チェック
    clipElementCheck(clips)
    clipOrderCheck(clips)
    //all以外に影響を与えていないか
    clipDoc.clipsMap.delete(period)
    const oldClipDoc = oldClipDocs.get(id)
    assert(typeof oldClipDoc !== `undefined`, `oldClipDoc is undefined`)
    oldClipDoc.clipsMap.delete(period)
    expect(clipDoc).toEqual(oldClipDoc)
}
