import 'jest'
import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { describe } from 'node:test'
import { onAddStreamer } from '~/src';
import { WrappedFunction, WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { Change } from 'firebase-functions/v2/firestore';
import { testEnv } from '~/test/setUp';
import { StreamerRepository } from '~/src/repositories/streamer';
import { ClipRepository } from '~/src/repositories/clip';

describe('onAddStreamerのテスト', () => {
    let wrappedOnAddStreamer: WrappedScheduledFunction | WrappedFunction<Change<QueryDocumentSnapshot>>;
    beforeAll(() => {
        wrappedOnAddStreamer = testEnv.wrap(onAddStreamer);
    })

    test('新しいストリーマーのloginが追加されると、twitch apiからそのストリーマーの情報を取得し、streamersに格納される', async () => {
        const path = "streamers/new";
        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: []
        }, path);
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: ["surugamonkey0113"]
        }, path);
        const change = testEnv.makeChange(beforeSnap, afterSnap);

        await wrappedOnAddStreamer(change);
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        const streamers = await streamerRepository.fetchFirestoreStreamers();
        const newStreamer = streamers?.find(e => e.login == "surugamonkey0113");
        expect(newStreamer).toBeDefined();
        expect(newStreamer?.id).toBeDefined();
        expect(await clipRepository.fetchClip(newStreamer!.id)).not.toThrowError;
    })
})