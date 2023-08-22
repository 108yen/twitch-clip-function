import 'jest'
import { describe } from 'node:test'
import { getTwitchClipForAllRankingFunction } from '../../../src';
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '../../../test/setUp';
import * as functions from 'firebase-functions';
import { StreamerRepository } from '../../../src/repositories/streamer';
import { clipDocRef } from '../../../src/firestore-refs/clipRefs';
import { ClipDoc } from '../../../src/models/clipDoc';
import { ClipRepository } from '../../../src/repositories/clip';
import { Clip } from '../../../src/models/clip';

describe(`getTwitchClipForAllRankingFunctionのテスト`, () => {
    let wrappedGetTwitchClipForAllRankingFunction: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedGetTwitchClipForAllRankingFunction = testEnv.wrap(getTwitchClipForAllRankingFunction);
    })

    test(`更新`, async () => {
        const streamerRepository = new StreamerRepository();
        const streamers = await streamerRepository.fetchFirestoreStreamers();
        //準備 データを消す
        const initedClipDoc = new ClipDoc({
            clipsMap: new Map<string, Array<Clip>>([
                [`all`, []],
            ])
        });
        for (const key in streamers) {
            const element = streamers[key];
            try {
                await clipDocRef({ clipId: element.id })
                    .set(initedClipDoc, { merge: true });
            } catch (error) {
                functions.logger.debug(`初期化エラー: ${error}`);
            }
        }
        try {
            await clipDocRef({ clipId: `summary` })
                .set(initedClipDoc, { merge: true });
        } catch (error) {
            functions.logger.debug(`初期化エラー: ${error}`);
        }

        //実行
        await wrappedGetTwitchClipForAllRankingFunction();

        //更新されているか
        const clipRepository = new ClipRepository();
        //各ストリーマーのクリップ
        for (const key in streamers) {
            const element = streamers[key];
            const clipDoc = await clipRepository.fetchClip(element.id);

            //各期間のクリップがあるか
            const allPeriodClips = clipDoc.clipsMap.get(`all`);
            expect(allPeriodClips).toBeDefined();
            expect(allPeriodClips!.length).toBeGreaterThan(90);
            //  中身の要素確認
            for (const key_j in allPeriodClips!) {
                const element = allPeriodClips[key_j];
                expect(element.title).toBeDefined();
                expect(element.view_count).toBeDefined();
                expect(element.created_at).toBeDefined();
                expect(element.broadcaster_name).toBeDefined();
                expect(element.embed_url).toBeDefined();
            }
        }
        //全体のランキング
        const clipDoc = await clipRepository.fetchClip(`summary`);
        const allPeriodClips = clipDoc.clipsMap.get(`all`);
        expect(allPeriodClips).toBeDefined();
        expect(allPeriodClips!.length).toEqual(100);

        //  中身の要素確認
        for (const key_j in allPeriodClips!) {
            const element = allPeriodClips[key_j];
            expect(element.title).toBeDefined();
            expect(element.view_count).toBeDefined();
            expect(element.created_at).toBeDefined();
            expect(element.broadcaster_name).toBeDefined();
            expect(element.embed_url).toBeDefined();
        }

    }, 20000)
})