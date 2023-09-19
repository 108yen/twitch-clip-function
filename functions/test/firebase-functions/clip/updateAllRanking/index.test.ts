import assert from "assert"
import { describe } from "node:test"

import { WrappedScheduledFunction } from "firebase-functions-test/lib/main"

import { updateAllRanking } from "../../../../src"
import { Clip } from "../../../../src/models/clip"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { testEnv } from "../../../setUp"

describe(`updateAllRankingのテスト`, () => {
    let wrappedUpdateAllRanking: WrappedScheduledFunction
    beforeAll(() => {
        wrappedUpdateAllRanking = testEnv.wrap(
            updateAllRanking
        )
    })

    test(`更新`, async () => {
        const streamerRepository = new StreamerRepository()
        const clipRepository = new ClipRepository()
        const streamers = await streamerRepository.getStreamers()
        const oldClipDocs = new Map<string, ClipDoc>()
        //準備 データを消す
        const initedClipDoc = new ClipDoc({
            clipsMap: new Map<string, Array<Clip>>([[`all`, []]])
        })
        for (const key in streamers) {
            const element = streamers[key]
            oldClipDocs.set(element.id, await clipRepository.getClip(element.id))
            await clipRepository.updateClip(element.id, initedClipDoc)
        }
        oldClipDocs.set(`summary`, await clipRepository.getClip(`summary`))
        await clipRepository.updateClip(`summary`, initedClipDoc)

        //実行
        await wrappedUpdateAllRanking()

        //各ストリーマーのクリップ
        for (const key in streamers) {
            const streamer = streamers[key]
            const clipDoc = await clipRepository.getClip(streamer.id)

            //各期間のクリップがあるか
            const clips = clipDoc.clipsMap.get(`all`)
            assert(typeof clips !== `undefined`, `clips is undefind`)
            //大体90以上だけど、たまに0とかある
            // expect(clips!.length).toEqual(100);
            if (clips.length < 10) {
                console.debug(`num:${clips.length}, ${streamer.display_name}`)
            }
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
                assert(typeof currentClipViewConut === `number`, message)
                assert(typeof nextClipViewCount === `number`, message)
                expect(currentClipViewConut).toBeGreaterThanOrEqual(nextClipViewCount)
            }
            //all以外に影響を与えていないか
            clipDoc.clipsMap.delete(`all`)
            const oldClipDoc = oldClipDocs.get(streamer.id)
            assert(typeof oldClipDoc !== `undefined`, `oldClipDoc is undefined`)
            oldClipDoc.clipsMap.delete(`all`)
            expect(clipDoc).toEqual(oldClipDoc)
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`summary`)
        const clips = clipDoc.clipsMap.get(`all`)
        assert(typeof clips !== `undefined`, `clips is undefind`)
        expect(clips).toBeDefined()
        expect(clips.length).toEqual(100)

        //  中身の要素確認
        for (const key_j in clips) {
            const element = clips[key_j]
            expect(element.title).toBeDefined()
            expect(element.view_count).toBeDefined()
            expect(element.created_at).toBeDefined()
            expect(element.broadcaster_name).toBeDefined()
            expect(element.embed_url).toBeDefined()
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
        //all以外に影響を与えていないか
        clipDoc.clipsMap.delete(`all`)
        const oldClipDoc = oldClipDocs.get(`summary`)
        assert(typeof oldClipDoc !== `undefined`, `oldClipDoc is undefined`)
        oldClipDoc.clipsMap.delete(`all`)
        expect(clipDoc).toEqual(oldClipDoc)
    }, 300000)
})
