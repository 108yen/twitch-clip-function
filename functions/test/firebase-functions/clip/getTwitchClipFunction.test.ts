import 'jest'
import { describe } from 'node:test'
import { getTwitchClipFunction } from '../../../src';
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '../../../test/setUp';
import * as functions from 'firebase-functions';
import { StreamerRepository } from '../../../src/repositories/streamer';
import { clipDocRef } from '../../../src/firestore-refs/clipRefs';
import { ClipDoc } from '../../../src/models/clipDoc';
import { Clip } from '../../../src/models/clip';
import { ClipRepository } from '../../../src/repositories/clip';

describe(`getTwitchClipFunctionのテスト`, () => {
    let wrappedGetTwitchClipFuntion: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedGetTwitchClipFuntion = testEnv.wrap(getTwitchClipFunction);
    })

    test(`更新`, async () => {

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
        await wrappedGetTwitchClipFuntion();

        //更新されているか
        const clipRepository = new ClipRepository();
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
                expect(clipDoc.clipsMap.get(period)?.length).toBeGreaterThan(0);
                //中身の要素確認
                for (const key in clipDoc.clipsMap.get(period)!) {
                    const element = (clipDoc.clipsMap.get(period)!)[key];
                    expect(element.title).toBeDefined();
                    expect(element.view_count).toBeDefined();
                    expect(element.created_at).toBeDefined();
                    expect(element.broadcaster_name).toBeDefined();
                    expect(element.embed_url).toBeDefined();
                }
            }
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`summary`);
        const periods = [`day`, `week`, `month`, `year`];
        for (const key in periods) {
            const period = periods[key];
            expect(clipDoc.clipsMap.get(period)).toBeDefined();
            expect(clipDoc.clipsMap.get(period)?.length).toBeGreaterThan(0);
        }

    }, 20000)
})