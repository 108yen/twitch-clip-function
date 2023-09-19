import assert from "assert"
import { describe } from "node:test"

import { WrappedScheduledFunction } from "firebase-functions-test/lib/main"

import { updateEachPeriodsRanking } from "../../../../src"
import { Clip } from "../../../../src/models/clip"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { testEnv } from "../../../setUp"
// import fs from "fs";

describe(`updateEachPeriodsRankingのテスト`, () => {
    let wrappedUpdateEachPeriodsRanking: WrappedScheduledFunction
    beforeAll(() => {
        wrappedUpdateEachPeriodsRanking = testEnv.wrap(updateEachPeriodsRanking)
    })

    test(`更新`, async () => {
        const clipRepository = new ClipRepository()
        const streamerRepository = new StreamerRepository()
        const streamers = await streamerRepository.getStreamers()
        const oldClipDocs = new Map<string, ClipDoc>()

        //!mockdata作成
        // const mock1 = await clipRepository.getClip(`49207184`);
        // const mock2 = await clipRepository.getClip(`545050196`);
        // const json1 = JSON.stringify(Object.fromEntries(mock1.clipsMap.entries()));
        // fs.writeFileSync(`data/clipDoc/49207184.json`, json1);
        // const json2 = JSON.stringify(Object.fromEntries(mock2.clipsMap.entries()));
        // fs.writeFileSync(`data/clipDoc/545050196.json`, json2);

        //準備 データを消す
        const initedClipDoc = new ClipDoc({
            clipsMap: new Map<string, Array<Clip>>([
                [`day`, []],
                [`week`, []],
                [`month`, []],
                [`year`, []]
            ])
        })
        for (const key in streamers) {
            const element = streamers[key]
            oldClipDocs.set(
                element.id,
                await clipRepository.getClip(element.id)
            )
            await clipRepository.updateClip(element.id, initedClipDoc)
        }
        oldClipDocs.set(`summary`, await clipRepository.getClip(`summary`))
        await clipRepository.updateClip(`summary`, initedClipDoc)

        //実行
        await wrappedUpdateEachPeriodsRanking()

        //各ストリーマーのクリップ
        for (const key in streamers) {
            const streamer = streamers[key]
            const clipDoc = await clipRepository.getClip(streamer.id)

            //各期間のクリップがあるか
            expect(clipDoc.clipsMap.size).toBeGreaterThanOrEqual(4)
            const periods = [`day`, `week`, `month`, `year`]
            const oldClipDoc = oldClipDocs.get(streamer.id)
            assert(typeof oldClipDoc !== `undefined`, `oldClipDoc is undefined`)
            for (const key in periods) {
                const period = periods[key]
                expect(clipDoc.clipsMap.get(period)).toBeDefined()
                // expect(clipDoc.clipsMap.get(period)?.length).toBeGreaterThan(0);
                //中身の要素確認
                const clips = clipDoc.clipsMap.get(period)
                assert(typeof clips !== `undefined`, `clips is undefined`)
                for (const key in clips) {
                    const clip = clips[key]
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
                    assert(typeof currentClipViewConut === `number`, message)
                    assert(typeof nextClipViewCount === `number`, message)
                    expect(currentClipViewConut).toBeGreaterThanOrEqual(
                        nextClipViewCount
                    )
                }
                //all以外に影響を与えていないか
                clipDoc.clipsMap.delete(period)
                oldClipDoc.clipsMap.delete(period)
            }
            expect(clipDoc).toEqual(oldClipDoc)
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`summary`)

        const periods = [`day`, `week`, `month`, `year`]
        const oldClipDoc = oldClipDocs.get(`summary`)
        assert(typeof oldClipDoc !== `undefined`, `oldClipDoc is undefined`)
        for (const key in periods) {
            const period = periods[key]
            expect(clipDoc.clipsMap.get(period)).toBeDefined()
            expect(clipDoc.clipsMap.get(period)?.length).toEqual(100)
            //中身の要素確認
            const clips = clipDoc.clipsMap.get(period)
            assert(typeof clips !== `undefined`, `clips is undefined`)
            for (const key in clips) {
                const clip = clips[key]
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
                assert(typeof currentClipViewConut === `number`, message)
                assert(typeof nextClipViewCount === `number`, message)
                expect(currentClipViewConut).toBeGreaterThanOrEqual(
                    nextClipViewCount
                )
            }

            //all以外に影響を与えていないか
            clipDoc.clipsMap.delete(period)
            oldClipDoc.clipsMap.delete(period)
        }
        expect(clipDoc).toEqual(oldClipDoc)
    }, 540000)
})
