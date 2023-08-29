import 'jest'
import { describe } from 'node:test'
import { TwitchClipApi } from '../../src/apies/clip';
import { Clip } from '../../src/models/clip';

describe(`TwitchClipApiのテスト`, () => {
    test(`getClips`, async () => {
        const twitchClipApi = new TwitchClipApi();
        expect(twitchClipApi.getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        )).not.toThrowError();

        const now = new Date(); // get present date
        const daysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); //days ago
        const result: Array<Clip> = await twitchClipApi.getClips(
            203654142,
            process.env.TWITCH_CLIENT_ID!,
            daysAgo,
            now,
        )
        expect(result.length).toEqual(100);
    })
})