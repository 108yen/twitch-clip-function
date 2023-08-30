import 'jest'
import { describe } from 'node:test'
import { TwitchClipApi } from '../../src/apis/clip';
import { Clip } from '../../src/models/clip';

describe(`TwitchClipApiのテスト`, () => {
    test(`getClips:期間指定`, async () => {

        const twitchClipApi = await TwitchClipApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        const now = new Date(); // get present date
        const daysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); //days ago
        const result: Array<Clip> = await twitchClipApi.getClips(
            203654142,
            process.env.TWITCH_CLIENT_ID!,
            daysAgo,
            now,
        )
        expect(result.length).toEqual(100);
        for (const key in result) {
            const clip = result[key];
            expect(clip.title).toBeDefined();
            expect(clip.view_count).toBeDefined();
            expect(clip.created_at).toBeDefined();
            const date = new Date(clip.created_at!);
            expect(date.getTime()).toBeGreaterThanOrEqual(daysAgo.getTime());
            expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
            expect(clip.broadcaster_name).toBeDefined();
            expect(clip.embed_url).toBeDefined();
            expect(clip.creator_name).toBeDefined();
        }
    })
    test(`getClips:期間未指定`, async () => {

        const twitchClipApi = await TwitchClipApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        
        const result: Array<Clip> = await twitchClipApi.getClips(
            203654142,
            process.env.TWITCH_CLIENT_ID!,
        )
        expect(result.length).toEqual(100);
        for (const key in result) {
            const clip = result[key];
            expect(clip.title).toBeDefined();
            expect(clip.view_count).toBeDefined();
            expect(clip.created_at).toBeDefined();
            expect(clip.broadcaster_name).toBeDefined();
            expect(clip.embed_url).toBeDefined();
            expect(clip.creator_name).toBeDefined();
        }
    })
})