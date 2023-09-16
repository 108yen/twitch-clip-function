import 'jest'
import { describe } from 'node:test'
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '../../../test/setUp';
import { streamerSelection } from '../../../src/firebase-functions/streamer/streamerSelection'
import { StreamerRepository } from '../../../src/repositories/streamer';
import { ClipRepository } from '../../../src/repositories/clip';

describe(`streamerSelectionのテスト`, () => {
    let wrappedStreamerSelection: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedStreamerSelection = testEnv.wrap(streamerSelection);
    })
    test(`streamerSelectionの実行テスト`, async () => {

        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();

        const oldStreamer = await streamerRepository.getStreamers();
        const oldStreamerIds = oldStreamer.map(e => e.id);

        //実行
        await wrappedStreamerSelection();

        const newStreamer = await streamerRepository.getStreamers();
        const newStreamerIds = newStreamer.map(e => e.id);
        const removedStreamerIds = oldStreamerIds
            .filter(id => newStreamerIds.indexOf(id) == -1);
        //ドキュメントが作成されている,ストリーマーリストのドキュメントが作成されている
        for (const key in newStreamerIds) {
            const id = newStreamerIds[key];
            await expect(clipRepository.getClip(id)).resolves.toBeDefined();
        }
        //ドキュメントが削除されている
        for (const key in removedStreamerIds) {
            const id = removedStreamerIds[key];
            await expect(clipRepository.getClip(id)).rejects.toThrow();
        }
        //ストリーマー情報チェック
        expect(newStreamer.length).toBeGreaterThan(0);
        //主要な情報があるか
        for (const key in newStreamer) {
            const element = newStreamer[key];
            //idが存在しているか
            expect(element.id).toBeDefined();
            //その他主要な項目があるか
            expect(element.created_at).toBeDefined();
            expect(element.description).toBeDefined();
            expect(element.display_name).toBeDefined();
            expect(element.login).toBeDefined();
            expect(element.profile_image_url).toBeDefined();
            expect(element.follower_num).toBeDefined();
        }
        //順番チェック
        for (let index = 0; index < newStreamer.length - 1; index++) {
            expect(newStreamer[index].follower_num!).toBeGreaterThanOrEqual(newStreamer[index + 1].follower_num!);
        }
        //重複チェック
        const newStreamerIdSets = new Set(newStreamerIds);
        expect(newStreamerIdSets.size).toEqual(newStreamerIds.length);

    }, 100000)
})