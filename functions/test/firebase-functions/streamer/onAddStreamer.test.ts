import 'jest'
import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { describe } from 'node:test'
import { onAddStreamer } from '~/src';
import { WrappedFunction, WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { Change } from 'firebase-functions/v2/firestore';
import { testEnv } from '~/test/setUp';
import { StreamerRepository } from '~/src/repositories/streamer';
import { ClipRepository } from '~/src/repositories/clip';
import { clipDocRef } from '~/src/firestore-refs/clipRefs';
import { streamersDocRef } from '~/src/firestore-refs/streamerRefs';
import { FieldValue } from 'firebase-admin/firestore';

describe('onAddStreamerのテスト', () => {
    let wrappedOnAddStreamer: WrappedScheduledFunction | WrappedFunction<Change<QueryDocumentSnapshot>>;
    beforeAll(() => {
        wrappedOnAddStreamer = testEnv.wrap(onAddStreamer);
    })

    test('新しいストリーマーのloginが追加されると、twitch apiからそのストリーマーの情報を取得し、streamersに格納される', async () => {
        const path = "streamers/new";
        const testLogin = "surugamonkey0113";
        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: []
        }, path);
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: [testLogin]
        }, path);
        const change = testEnv.makeChange(beforeSnap, afterSnap);

        await wrappedOnAddStreamer(change);
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        const streamers = await streamerRepository.fetchFirestoreStreamers();
        const newStreamer = streamers?.find(e => e.login == testLogin);
        expect(newStreamer).toBeDefined();
        expect(newStreamer?.id).toBeDefined();
        expect(await clipRepository.fetchClip(newStreamer!.id)).not.toThrowError;

        //後処理
        await clipDocRef({ clipId: newStreamer!.id }).delete();
        await streamersDocRef.update({
            streamers: FieldValue.arrayRemove(testLogin)
        });
    })
})