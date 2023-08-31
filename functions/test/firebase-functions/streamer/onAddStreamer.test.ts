import 'jest'
import { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { describe } from 'node:test'
import { onAddStreamer } from '../../../src';
import { WrappedFunction, WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { Change } from 'firebase-functions/v2/firestore';
import { testEnv } from '../../../test/setUp';
import { StreamerRepository } from '../../../src/repositories/streamer';
import { ClipRepository } from '../../../src/repositories/clip';
import { clipColRef, clipDocRef } from '../../../src/firestore-refs/clipRefs';
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

        await wrappedOnAddStreamer(change);

        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        const streamers = await streamerRepository.getStreamers();
        for (const key in testLogins) {
            const element = testLogins[key];
            const newStreamer = streamers?.find(e => e.login == element);
            //streamerリストに追加できているか
            expect(newStreamer).toBeDefined();
            expect(newStreamer?.id).toBeDefined();
            //clipのドキュメントが作成出来ているか
            expect(await clipRepository.getClip(newStreamer!.id)).not.toThrowError;

            //後処理
            await clipDocRef({ clipId: newStreamer!.id }).delete();
            await streamersDocRef.update({
                streamers: FieldValue.arrayRemove(newStreamer)
            });
        }

    })
    test(`追加済みのチャンネルの追加`, async () => {
        const path = `streamers/new`;
        const testLogin = `surugamonkey0113`;
        const streamerRepository = new StreamerRepository();
        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: []
        }, path);
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: [testLogin]
        }, path);
        const change = testEnv.makeChange(beforeSnap, afterSnap);

        const preStreamers = await streamerRepository.getStreamers();
        const preClipQst = await clipColRef.get();
        const preClips = preClipQst.docs.map(doc => doc.data());

        await wrappedOnAddStreamer(change);
        //streamerリストに変更がないか
        const streamers = await streamerRepository.getStreamers();
        expect(streamers).toEqual(preStreamers);

        //clipのdocument listが変更されていないか
        const clipQst = await clipColRef.get();
        const clips = clipQst.docs.map(doc => doc.data());
        expect(clips).toEqual(preClips);
    })
    test(`存在しないチャンネルの追加`, async () => {
        const path = `streamers/new`;
        const testLogin = `surugamonkey`;
        const streamerRepository = new StreamerRepository();
        const beforeSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: []
        }, path);
        const afterSnap = testEnv.firestore.makeDocumentSnapshot({
            logins: [testLogin]
        }, path);
        const change = testEnv.makeChange(beforeSnap, afterSnap);

        const preStreamers = await streamerRepository.getStreamers();
        const preClipQst = await clipColRef.get();
        const preClips = preClipQst.docs.map(doc => doc.data());

        await wrappedOnAddStreamer(change);
        //streamerリストに変更がないか
        const streamers = await streamerRepository.getStreamers();
        expect(streamers).toEqual(preStreamers);

        //clipのdocument listが変更されていないか
        const clipQst = await clipColRef.get();
        const clips = clipQst.docs.map(doc => doc.data());
        expect(clips).toEqual(preClips);
    })
    test(`twitch apiの不具合`, async () => {
        
    })
})