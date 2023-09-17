import 'jest'
import { describe } from 'node:test'
import { getTwitchClipForAllRankingFunction } from '../../../../src';
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '../../../../test/setUp';
import * as functions from 'firebase-functions';
import { StreamerRepository } from '../../../../src/repositories/streamer';
import { ClipDoc } from '../../../../src/models/clipDoc';
import { ClipRepository } from '../../../../src/repositories/clip';
import { Clip } from '../../../../src/models/clip';

describe(`getTwitchClipForAllRankingFunctionのテスト`, () => {
    let wrappedGetTwitchClipForAllRankingFunction: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedGetTwitchClipForAllRankingFunction = testEnv.wrap(getTwitchClipForAllRankingFunction);
    })

    test(`更新`, async () => {
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        const streamers = await streamerRepository.getStreamers();
        //準備 データを消す
        const initedClipDoc = new ClipDoc({
            clipsMap: new Map<string, Array<Clip>>([
                [`all`, []],
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
        await wrappedGetTwitchClipForAllRankingFunction();

        //各ストリーマーのクリップ
        for (const key in streamers) {
            const element = streamers[key];
            const clipDoc = await clipRepository.getClip(element.id);

            //各期間のクリップがあるか
            const clips = clipDoc.clipsMap.get(`all`);
            expect(clips).toBeDefined();
            //大体90以上だけど、たまに0とかある
            // expect(clips!.length).toEqual(100);
            if (clips!.length < 10) {
                console.debug(`num:${clips!.length}, ${element.display_name}`);
            }
            //  中身の要素確認
            for (const key_j in clips!) {
                const element = clips[key_j];
                expect(element.title).toBeDefined();
                expect(element.view_count).toBeDefined();
                expect(element.created_at).toBeDefined();
                expect(element.broadcaster_name).toBeDefined();
                expect(element.embed_url).toBeDefined();
            }
            //順番チェック
            for (let index = 0; index < clips!.length - 1; index++) {
                expect(clips![index].view_count!).toBeGreaterThanOrEqual(clips![index + 1].view_count!);
            }
        }
        //全体のランキング
        const clipDoc = await clipRepository.getClip(`summary`);
        const clips = clipDoc.clipsMap.get(`all`);
        expect(clips).toBeDefined();
        expect(clips!.length).toEqual(100);

        //  中身の要素確認
        for (const key_j in clips!) {
            const element = clips[key_j];
            expect(element.title).toBeDefined();
            expect(element.view_count).toBeDefined();
            expect(element.created_at).toBeDefined();
            expect(element.broadcaster_name).toBeDefined();
            expect(element.embed_url).toBeDefined();
        }
        //順番チェック
        for (let index = 0; index < clips!.length - 1; index++) {
            expect(clips![index].view_count!).toBeGreaterThanOrEqual(clips![index + 1].view_count!);
        }

    }, 300000)
})