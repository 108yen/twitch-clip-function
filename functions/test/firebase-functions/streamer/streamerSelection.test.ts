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

    test(`更新`, async () => {

        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();

        const oldStreamer = await streamerRepository.getStreamers();
        const oldStreamerIds = oldStreamer.map(e => e.id);

        //実行
        await wrappedStreamerSelection();

        const newStreamer = await streamerRepository.getStreamers();
        const newStreamerIds = newStreamer.map(e => e.id);
        const addedStreamerIds = newStreamerIds
            .filter(id => oldStreamerIds.indexOf(id) == -1);
        const removedStreamerIds = oldStreamerIds
            .filter(id => newStreamerIds.indexOf(id) == -1);
        //ドキュメントが作成されている
        for (const key in addedStreamerIds) {
            const id = addedStreamerIds[key];
            expect(await clipRepository.getClip(id)).not.toThrowError;
        }
        //ドキュメントが削除されている
        for (const key in removedStreamerIds) {
            const id = removedStreamerIds[key];
            expect(await clipRepository.getClip(id)).toThrowError;
        }

    }, 100000)
})