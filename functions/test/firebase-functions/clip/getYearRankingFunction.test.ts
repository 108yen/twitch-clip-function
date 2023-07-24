import 'jest'
import { describe } from 'node:test'
import { getYearRankingFunction } from '../../../src';
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '../../../test/setUp';
import * as functions from 'firebase-functions';
import { StreamerRepository } from '../../repositories/streamer';
import { clipDocRef } from '../../firestore-refs/clipRefs';
import { ClipDoc } from '../../models/clipDoc';
import { ClipRepository } from '../../repositories/clip';

describe(`getYearRankingFunctionのテスト`, () => {
    let wrappedGetYearRankingFunction: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedGetYearRankingFunction = testEnv.wrap(getYearRankingFunction);
    })

    test(`更新`, async () => {
        const streamerRepository = new StreamerRepository();
        const streamers = await streamerRepository.fetchFirestoreStreamers();
        //準備 データを消す(個別はめんどくさいのでやらない)
        const initedClipDoc = new ClipDoc();
        try {
            await clipDocRef({ clipId: `past_summary` })
                .set(initedClipDoc);
        } catch (error) {
            functions.logger.debug(`初期化エラー: ${error}`);
        }

        //実行
        await wrappedGetYearRankingFunction();

        const sleep = (second: number) => new Promise(resolve => setTimeout(resolve, second * 1000))
        await sleep(5);

        //更新されているか
        const clipRepository = new ClipRepository();
        //各ストリーマーのクリップ
        for (const key in streamers) {
            const element = streamers[key];
            const clipDoc = await clipRepository.fetchClip(element.id);

            //各期間のクリップがあるか
            expect(clipDoc.clipsMap.size).toBeGreaterThanOrEqual(4)
            for (const [_, value] of clipDoc.clipsMap) {
                //  中身の要素確認
                for (const key_j in value) {
                    const element = value[key_j];
                    expect(element.title).toBeDefined();
                    expect(element.view_count).toBeDefined();
                    expect(element.created_at).toBeDefined();
                    expect(element.broadcaster_name).toBeDefined();
                    expect(element.embed_url).toBeDefined();
                }
            }
        }
        //全体のランキング
        const clipDoc = await clipRepository.fetchClip(`past_summary`);
        for (const [_, value] of clipDoc.clipsMap) {
            expect(value).toBeDefined();
            expect(value.length).toBeGreaterThan(0);
            //  中身の要素確認
            for (const key_j in value) {
                const element = value[key_j];
                expect(element.title).toBeDefined();
                expect(element.view_count).toBeDefined();
                expect(element.created_at).toBeDefined();
                expect(element.broadcaster_name).toBeDefined();
                expect(element.embed_url).toBeDefined();
            }
        }
    }, 20000)
})