import 'jest'
import { describe } from 'node:test'
import { updateStreamer } from '~/src';
import { WrappedScheduledFunction } from 'firebase-functions-test/lib/main';
import { testEnv } from '~/test/setUp';
import { StreamerRepository } from '~/src/repositories/streamer';
import { streamersDocRef } from '~/src/firestore-refs/streamerRefs';
import { Streamer } from '~/src/models/streamer';

describe('updateStreamerのテスト', () => {
    let wrappedUpdateStreamer: WrappedScheduledFunction;
    beforeAll(() => {
        wrappedUpdateStreamer = testEnv.wrap(updateStreamer);
    })

    test('更新', async () => {

        const streamerRepository = new StreamerRepository();
        const streamers = await streamerRepository.fetchFirestoreStreamers();
        //準備 id以外を消す
        const beforeStreamers = streamers.map(e => new Streamer({
            id: e.id
        }));
        try {
            await streamersDocRef.update({
                streamers: beforeStreamers
            });
        } catch (error) {
            
        }
        //実行
        await wrappedUpdateStreamer();
        //streamerが存在しているか
        expect(streamers.length).toBeGreaterThan(0);
        for (const key in streamers) {
            const element = streamers[key];
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

    })
})