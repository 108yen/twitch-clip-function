import assert from "assert"
import { describe } from "node:test"

import { WrappedScheduledFunction } from "firebase-functions-test/lib/main"

import { getYearRankingFunction } from "../../../../src"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { testEnv } from "../../../setUp"

describe(`getYearRankingFunctionのテスト`, () => {
    let wrappedGetYearRankingFunction: WrappedScheduledFunction
    beforeAll(() => {
        wrappedGetYearRankingFunction = testEnv.wrap(getYearRankingFunction)
    })

    test(`更新`, async () => {
        const clipRepository = new ClipRepository()
        const streamerRepository = new StreamerRepository()
        const streamers = await streamerRepository.getStreamers()
        const oldClipDocs = new Map<string, ClipDoc>()
        //準備 データを消す

        const removePeriods = [`day`, `week`, `month`, `year`, `all`]
        for (const key in streamers) {
            const streamer = streamers[key]
            const clipDoc = await clipRepository.getClip(streamer.id)
            for (const [, period] of removePeriods) {
                clipDoc.clipsMap.delete(period)
            }
            oldClipDocs.set(streamer.id, clipDoc)
            await clipRepository.updateClip(streamer.id, clipDoc)
        }
        await clipRepository.createClipDoc(`past_summary`)

        //実行
        await wrappedGetYearRankingFunction()

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
                if (clips.length == 0) {
                    console.log(`${streamer.display_name},${period}`)
                }
                expect(clips.length).toBeGreaterThan(0)
                //  中身の要素確認
                for (const key_j in clips) {
                    const clip = clips[key_j]
                    expect(clip.title).toBeDefined()
                    expect(clip.view_count).toBeDefined()
                    expect(clip.created_at).toBeDefined()
                    expect(clip.broadcaster_name).toBeDefined()
                    expect(clip.embed_url).toBeDefined()
                    if (!isNaN(Number(period))) {
                        const year = parseInt(period)
                        const started_at = new Date(year, 0, 1, 0, 0, 0)
                        const ended_at = new Date(year, 11, 31, 23, 59, 59)
                        assert(
                            typeof clip.created_at !== `undefined`,
                            `created_at is undefined`
                        )
                        expect(
                            new Date(clip.created_at).getTime()
                        ).toBeGreaterThanOrEqual(started_at.getTime())
                        expect(new Date(clip.created_at).getTime()).toBeLessThanOrEqual(
                            ended_at.getTime()
                        )
                    }
                }
                clipDoc.clipsMap.delete(period)
                oldClipDoc.clipsMap.delete(period)

                //順番チェック
                // for (let index = 0; index < clips.length - 1; index++) {
                //     expect(clips[index].view_count!).toBeGreaterThanOrEqual(clips[index + 1].view_count!);
                // }
            }
            //ほかに影響を与えていないか
            expect(clipDoc).toEqual(oldClipDoc)
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`past_summary`)
        for (const [period, clips] of clipDoc.clipsMap) {
            expect(clips).toBeDefined()
            expect(clips.length).toBeGreaterThan(0)
            //  中身の要素確認
            for (const key_j in clips) {
                const clip = clips[key_j]
                expect(clip.title).toBeDefined()
                expect(clip.view_count).toBeDefined()
                expect(clip.created_at).toBeDefined()
                expect(clip.broadcaster_name).toBeDefined()
                expect(clip.embed_url).toBeDefined()
                if (!isNaN(Number(period))) {
                    const year = parseInt(period)
                    const started_at = new Date(year, 0, 1, 0, 0, 0)
                    const ended_at = new Date(year, 11, 31, 23, 59, 59)
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
            //順番チェック
            for (let index = 0; index < clips.length - 1; index++) {
                const currentClipViewConut = clips[index].view_count
                const nextClipViewCount = clips[index + 1].view_count
                const message = `clips.view_count is undefind`
                assert(typeof currentClipViewConut === `number`, message)
                assert(typeof nextClipViewCount === `number`, message)
                expect(currentClipViewConut).toBeGreaterThanOrEqual(nextClipViewCount)
            }
        }
    }, 1000000)
})
