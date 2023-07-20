import 'jest'
import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { describe } from 'node:test'
import { onAddStreamer } from '~/src';
import { WrappedFunction, WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { Change } from 'firebase-functions/v2/firestore';
import { testEnv } from '~/test/setUp';
import { StreamerRepository } from '~/src/repositories/streamer';
import { clipDocRef } from '~/src/firestore-refs/clipRefs';

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

        // !これを実行すると、本番が変わる
        // await wrappedOnAddStreamer(change);
        // 結果を検証する（publicUsers/:accountId ドキュメントが作成されているはず）
        const repository = new StreamerRepository();
        const streamers = await repository.fetchFirestoreStreamers();
        const newStreamer = streamers?.find(e => e.login == "surugamonkey0113");
        expect(newStreamer).toBeDefined();
        expect(newStreamer?.id).toBeDefined();
        const clipDoc = clipDocRef({ clipId: newStreamer!.id }).get();
        expect(clipDoc).toBeDefined();
    })
})