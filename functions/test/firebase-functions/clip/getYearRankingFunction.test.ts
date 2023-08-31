import 'jest'
import { describe } from 'node:test'
import { getYearRankingFunction } from '../../../src';
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '../../../test/setUp';
import * as functions from 'firebase-functions';
import { StreamerRepository } from '../../../src/repositories/streamer';
import { clipDocRef } from '../../../src/firestore-refs/clipRefs';
import { ClipDoc } from '../../../src/models/clipDoc';
import { ClipRepository } from '../../../src/repositories/clip';

describe(`getYearRankingFunctionのテスト`, () => {
    let wrappedGetYearRankingFunction: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedGetYearRankingFunction = testEnv.wrap(getYearRankingFunction);
    })

    test(`更新`, async () => {
        const streamerRepository = new StreamerRepository();
        const streamers = await streamerRepository.getStreamers();
        //準備 データを消す
        const initedClipDoc = new ClipDoc();
        for (const key in streamers) {
            const element = streamers[key];
            try {
                await clipDocRef({ clipId: element.id })
                    .set(initedClipDoc);
            } catch (error) {
                functions.logger.debug(`初期化エラー: ${error}`);
            }
        }
        try {
            await clipDocRef({ clipId: `past_summary` })
                .set(initedClipDoc);
        } catch (error) {
            functions.logger.debug(`初期化エラー: ${error}`);
        }

        //実行
        await wrappedGetYearRankingFunction();

        //更新されているか
        const clipRepository = new ClipRepository();
        //各ストリーマーのクリップ
        for (const key in streamers) {
            const element = streamers[key];
            const clipDoc = await clipRepository.getClip(element.id);

            //各期間のクリップがあるか
            expect(clipDoc.clipsMap.size).toBeGreaterThan(0)
            for (const [period, value] of clipDoc.clipsMap) {
                expect(value).toBeDefined();
                if (value.length==0) {
                    console.log(`${element.display_name},${period}`)
                }
                expect(value.length).toBeGreaterThan(0);
                //  中身の要素確認
                for (const key_j in value) {
                    const element = value[key_j];
                    expect(element.title).toBeDefined();
                    expect(element.view_count).toBeDefined();
                    expect(element.created_at).toBeDefined();
                    expect(element.broadcaster_name).toBeDefined();
                    expect(element.embed_url).toBeDefined();
                    if (!isNaN(Number(period))) {
                        const year = parseInt(period);
                        const started_at = new Date(year, 0, 1, 0, 0, 0);
                        const ended_at = new Date(year, 11, 31, 23, 59, 59);
                        expect(new Date(element.created_at!).getTime()).toBeGreaterThanOrEqual(started_at.getTime());
                        expect(new Date(element.created_at!).getTime()).toBeLessThanOrEqual(ended_at.getTime());
                    }
                }
            }
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`past_summary`);
        for (const [period, value] of clipDoc.clipsMap) {
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
                if (!isNaN(Number(period))) {
                    const year = parseInt(period);
                    const started_at = new Date(year, 0, 1, 0, 0, 0);
                    const ended_at = new Date(year, 11, 31, 23, 59, 59);
                    expect(new Date(element.created_at!).getTime()).toBeGreaterThanOrEqual(started_at.getTime());
                    expect(new Date(element.created_at!).getTime()).toBeLessThanOrEqual(ended_at.getTime());
                }
            }
        }
    }, 20000)
})