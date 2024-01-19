/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe } from "node:test"

import { TwitchClipApi } from "../../src/apis/clip"
import { Clip } from "../../src/models/clip"
import dayjs from "../../src/utils/dayjs"

describe(`TwitchClipApiのテスト`, () => {
    let twitchClipApi: TwitchClipApi
    beforeAll(async () => {
        twitchClipApi = await TwitchClipApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        )
    })
    test(`getClips:期間指定`, async () => {
        const now = dayjs()
        const daysAgo = now.subtract(1, `year`) //days ago
        const result: Array<Clip> = await twitchClipApi.getClips(203654142, daysAgo, now)
        expect(result.length).toEqual(100)
        for (const key in result) {
            const clip = result[key]
            expect(clip.title).toBeDefined()
            expect(clip.view_count).toBeDefined()
            expect(clip.created_at).toBeDefined()
            const date = dayjs(clip.created_at!)
            expect(date.unix()).toBeGreaterThanOrEqual(daysAgo.unix())
            expect(date.unix()).toBeLessThanOrEqual(now.unix())
            expect(clip.broadcaster_name).toBeDefined()
            expect(clip.embed_url).toBeDefined()
            expect(clip.creator_name).toBeDefined()
        }
    })
    test(`getClips:期間未指定`, async () => {
        const result: Array<Clip> = await twitchClipApi.getClips(203654142)
        expect(result.length).toEqual(100)
        for (const key in result) {
            const clip = result[key]
            expect(clip.title).toBeDefined()
            expect(clip.view_count).toBeDefined()
            expect(clip.created_at).toBeDefined()
            expect(clip.broadcaster_name).toBeDefined()
            expect(clip.embed_url).toBeDefined()
            expect(clip.creator_name).toBeDefined()
        }
    })
})
