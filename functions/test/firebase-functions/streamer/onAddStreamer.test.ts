import 'jest'
import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { describe } from 'node:test'
import { onAddStreamer } from '../../../src';
import { WrappedFunction, WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { Change } from 'firebase-functions/v2/firestore';
import { testEnv } from '../../../test/setUp';
import { StreamerRepository } from '../../../src/repositories/streamer';
import { ClipRepository } from '../../../src/repositories/clip';
import { clipDocRef } from '../../../src/firestore-refs/clipRefs';
import { streamersDocRef } from '../../../src/firestore-refs/streamerRefs';
import { FieldValue } from 'firebase-admin/firestore';

describe(`onAddStreamerのテスト`, () => {
    let wrappedOnAddStreamer: WrappedScheduledFunction | WrappedFunction<Change<QueryDocumentSnapshot>>;
    beforeAll(() => {
        wrappedOnAddStreamer = testEnv.wrap(onAddStreamer);
    })

    test(`新規追加`, async () => {
        const path = `streamers/new`;
        const testLogins = [`akamikarubi`];
        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: []
        }, path);
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: testLogins
        }, path);
        const change = testEnv.makeChange(beforeSnap, afterSnap);

        const sleep = (second: number) => new Promise(resolve => setTimeout(resolve, second * 1000))
        await sleep(5);

        await wrappedOnAddStreamer(change);
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        const streamers = await streamerRepository.fetchFirestoreStreamers();
        for (const key in testLogins) {
            const element = testLogins[key];
            const newStreamer = streamers?.find(e => e.login == element);
            //streamerリストに追加できているか
            expect(newStreamer).toBeDefined();
            expect(newStreamer?.id).toBeDefined();
            //clipのドキュメントが作成出来ているか
            expect(await clipRepository.fetchClip(newStreamer!.id)).not.toThrowError;

            //後処理
            await clipDocRef({ clipId: newStreamer!.id }).delete();
            await streamersDocRef.update({
                streamers: FieldValue.arrayRemove(newStreamer)
            });
        }

    }, 10000)
    test(`追加済み`, async () => {
        const path = `streamers/new`;
        const testLogin = `surugamonkey0113`;
        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: []
        }, path);
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: [testLogin]
        }, path);
        const change = testEnv.makeChange(beforeSnap, afterSnap);

        const sleep = (second: number) => new Promise(resolve => setTimeout(resolve, second * 1000))
        await sleep(5);

        await wrappedOnAddStreamer(change);
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        //streamerリストに追加できているか
        const streamers = await streamerRepository.fetchFirestoreStreamers();
        const newStreamer = streamers?.find(e => e.login == testLogin);
        expect(streamers?.filter(e => e.login == testLogin).length).toEqual(1);
        expect(newStreamer).toBeDefined();
        expect(newStreamer?.id).toBeDefined();
        //clipのドキュメントが作成出来ているか
        expect(await clipRepository.fetchClip(newStreamer!.id)).not.toThrowError;
    }, 10000)
})