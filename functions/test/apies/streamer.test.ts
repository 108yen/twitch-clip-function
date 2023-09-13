import 'jest'
import { describe } from 'node:test'
import { TwitchStreamerApi } from '../../src/apis/streamer';

describe(`TwitchStreamerApiのテスト`, () => {
    test(`getFollowerNum`, async () => {

        const twitchClipApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        const id = `49207184`    //釈迦
        const followerNum = await twitchClipApi.getFollowerNum(id);
        expect(followerNum).toBeGreaterThan(0);
    })
    test(`getStreamers:id指定`, async () => {

        const twitchClipApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        const idList = [`49207184`, `50988750`];
        const streamers = await twitchClipApi.getStreamers(idList, true);

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
        }
    })
    test(`getStreamers:login指定`, async () => {

        const twitchClipApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        const loginList = [`stylishnoob4`, `fps_shaka`];
        const streamers = await twitchClipApi.getStreamers(loginList, false);

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
        }
    })
    test(`getJpStreams`, async () => {

        const twitchClipApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        const streams = await twitchClipApi.getJpStreams();

        expect(streams.length).toEqual(100);
        for (const key in streams) {
            const stream = streams[key];
            expect(stream.user_id).toBeDefined();
            expect(stream.user_login).toBeDefined();
            expect(stream.viewer_count).toBeDefined();
            expect(stream.tags).toBeDefined();
        }

    })
})