import 'jest'
import { describe } from 'node:test'
import { getTwitchClipFunction } from '../../../src';
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '../../../test/setUp';
import * as functions from 'firebase-functions';
import { StreamerRepository } from '../../../src/repositories/streamer';
import { ClipDoc } from '../../../src/models/clipDoc';
import { Clip } from '../../../src/models/clip';
import { ClipRepository } from '../../../src/repositories/clip';

describe(`getTwitchClipFunctionのテスト`, () => {
    let wrappedGetTwitchClipFuntion: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedGetTwitchClipFuntion = testEnv.wrap(getTwitchClipFunction);
    })
    
    test(`更新`, async () => {
        
        const clipRepository = new ClipRepository();
        const streamerRepository = new StreamerRepository();
        const streamers = await streamerRepository.getStreamers();
        //準備 データを消す
        const initedClipDoc = new ClipDoc({
            clipsMap: new Map<string, Array<Clip>>([
                [`day`, []],
                [`week`, []],
                [`month`, []],
                [`year`, []],
            ])
        });
        for (const key in streamers) {
            const element = streamers[key];
            try {
                await clipRepository.updateClip(element.id, initedClipDoc);
            } catch (error) {
                functions.logger.debug(`初期化エラー: ${error}`);
            }
        }
        try {
            await clipRepository.updateClip(`summary`, initedClipDoc);
        } catch (error) {
            functions.logger.debug(`初期化エラー: ${error}`);
        }

        //実行
        await wrappedGetTwitchClipFuntion();

        //各ストリーマーのクリップ
        for (const key in streamers) {
            const element = streamers[key];
            const clipDoc = await clipRepository.getClip(element.id);

            //各期間のクリップがあるか
            expect(clipDoc.clipsMap.size).toBeGreaterThanOrEqual(4)
            const periods = [`day`, `week`, `month`, `year`];
            for (const key in periods) {
                const period = periods[key];
                expect(clipDoc.clipsMap.get(period)).toBeDefined();
                // expect(clipDoc.clipsMap.get(period)?.length).toBeGreaterThan(0);
                //中身の要素確認
                const clips = clipDoc.clipsMap.get(period)!;
                for (const key in clips) {
                    const clip = clips[key];
                    expect(clip.title).toBeDefined();
                    expect(clip.view_count).toBeDefined();
                    expect(clip.created_at).toBeDefined();
                    expect(clip.broadcaster_name).toBeDefined();
                    expect(clip.embed_url).toBeDefined();
                }

                //順番チェック
                for (let index = 0; index < clips.length - 1; index++) {
                    expect(clips[index].view_count!).toBeGreaterThanOrEqual(clips[index + 1].view_count!);
                }
            }
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`summary`);
        const periods = [`day`, `week`, `month`, `year`];
        for (const key in periods) {
            const period = periods[key];
            expect(clipDoc.clipsMap.get(period)).toBeDefined();
            expect(clipDoc.clipsMap.get(period)?.length).toEqual(100);
            //中身の要素確認
            const clips = clipDoc.clipsMap.get(period)!;
            for (const key in clips) {
                const clip = clips[key];
                expect(clip.title).toBeDefined();
                expect(clip.view_count).toBeDefined();
                expect(clip.created_at).toBeDefined();
                expect(clip.broadcaster_name).toBeDefined();
                expect(clip.embed_url).toBeDefined();
            }

            //順番チェック
            for (let index = 0; index < clips.length - 1; index++) {
                expect(clips[index].view_count!).toBeGreaterThanOrEqual(clips[index + 1].view_count!);
            }
            
        }

    }, 540000)
})