import 'jest'
import { describe } from 'node:test'
import { getYearRankingFunction } from '../../../../src';
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '../../../setUp';
import * as functions from 'firebase-functions';
import { StreamerRepository } from '../../../../src/repositories/streamer';
import { ClipRepository } from '../../../../src/repositories/clip';

describe(`getYearRankingFunctionのテスト`, () => {
    let wrappedGetYearRankingFunction: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedGetYearRankingFunction = testEnv.wrap(getYearRankingFunction);
    })

    test(`更新`, async () => {
        
        const clipRepository = new ClipRepository();
        const streamerRepository = new StreamerRepository();
        const streamers = await streamerRepository.getStreamers();
        //準備 データを消す

        for (const key in streamers) {
            const element = streamers[key];
            try {
                await clipRepository.createClipDoc(element.id);
            } catch (error) {
                functions.logger.debug(`初期化エラー: ${error}`);
            }
        }
        try {
            await clipRepository.createClipDoc(`past_summary`);
        } catch (error) {
            functions.logger.debug(`初期化エラー: ${error}`);
        }

        //実行
        await wrappedGetYearRankingFunction();

        //各ストリーマーのクリップ
        for (const key in streamers) {
            const element = streamers[key];
            const clipDoc = await clipRepository.getClip(element.id);

            //各期間のクリップがあるか
            for (const [period, clips] of clipDoc.clipsMap) {
                if (period == 'all' || period == 'day' || period == 'week' || period == 'month' || period == 'year' ) {
                    break;
                }
                expect(clips).toBeDefined();
                if (clips.length==0) {
                    console.log(`${element.display_name},${period}`)
                }
                expect(clips.length).toBeGreaterThan(0);
                //  中身の要素確認
                for (const key_j in clips) {
                    const element = clips[key_j];
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

                //順番チェック
                // for (let index = 0; index < clips.length - 1; index++) {
                //     expect(clips[index].view_count!).toBeGreaterThanOrEqual(clips[index + 1].view_count!);
                // }
            }
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`past_summary`);
        for (const [period, clips] of clipDoc.clipsMap) {
            expect(clips).toBeDefined();
            expect(clips.length).toBeGreaterThan(0);
            //  中身の要素確認
            for (const key_j in clips) {
                const element = clips[key_j];
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
            //順番チェック
            for (let index = 0; index < clips.length - 1; index++) {
                expect(clips[index].view_count!).toBeGreaterThanOrEqual(clips[index + 1].view_count!);
            }
        }

    }, 1000000)
})