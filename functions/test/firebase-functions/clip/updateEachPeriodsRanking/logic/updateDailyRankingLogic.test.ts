import { faker } from "@faker-js/faker"

import { UpdateDailyRankingLogic } from "../../../../../src/firebase-functions/clip/updateEachPeriodsRanking/logic/updateDailyRankingLogic"
import { Clip } from "../../../../../src/models/clip"
import { ClipDoc } from "../../../../../src/models/clipDoc"
import { ClipRepository } from "../../../../../src/repositories/clip"
import { clipElementCheck, clipOrderCheck } from "../../checkFunctions"

describe(`UpdateDailyRankingLogicのテスト`, () => {
    let todayClips: Array<Clip>
    beforeAll(() => {
        const today = new Date()
        const lastDay = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        todayClips = createClipsData(lastDay, today)
    })
    afterEach(() => jest.restoreAllMocks())
    test(`ダミーデータがちゃんと作成出来ているかの確認`, async () => {
        const clipDoc = await createDammyData()
        for (const [, clips] of clipDoc.clipsMap) {
            clipOrderCheck(clips)
            clipElementCheck(clips)
        }
    })
    test(`0じの実行だった場合、clipDocを受け取ってdayランキングだけ出す`, async () => {
        const todayClipDoc = new ClipDoc({ clipsMap: new Map([[`day`, todayClips]]) })

        const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
        const clips = updateDailyRankingLogic[`extractDayClips`]()

        expect(clips).toEqual(todayClips)
    })
    test(`firestoreの今のdayランキングをとって入れなおす`, async () => {
        const getClipsSpy = jest
            .spyOn(ClipRepository.prototype, `getClip`)
            .mockImplementation(createDammyData)
        const updateClipsSpy = jest
            .spyOn(ClipRepository.prototype, `updateClip`)
            .mockImplementation()

        const todayClipDoc = new ClipDoc({
            clipsMap: new Map([[`day`, todayClips]])
        })

        const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
        await expect(updateDailyRankingLogic[`update`]()).resolves.not.toThrowError()

        expect(getClipsSpy).toHaveBeenCalledTimes(1)
        expect(updateClipsSpy).toHaveBeenCalledTimes(1)
        expect(updateClipsSpy.mock.calls[0][0]).toEqual(`daily`)
        const today = new Date()
        const expectedKeys = [...Array(7).keys()].map((index) => {
            const started_at = new Date(
                today.getTime() - (index + 1) * 24 * 60 * 60 * 1000
            )
            return `${started_at.getMonth() + 1}/${started_at.getDate()}`
        })
        expect(
            Array.from(updateClipsSpy.mock.calls[0][1].clipsMap.keys()).sort()
        ).toEqual(expectedKeys.sort())
        for (const [, clips] of updateClipsSpy.mock.calls[0][1].clipsMap) {
            clipOrderCheck(clips)
            clipElementCheck(clips)
        }
    })
    test(`compareDatesのテスト`, () => {
        const todayClipDoc = new ClipDoc({
            clipsMap: new Map([[`day`, todayClips]])
        })

        const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)

        expect(updateDailyRankingLogic[`compareDates`](`10/10`, `10/9`)).toEqual(1)
        expect(updateDailyRankingLogic[`compareDates`](`10/9`, `10/10`)).toEqual(-1)
        expect(updateDailyRankingLogic[`compareDates`](`10/9`, `9/10`)).toEqual(1)
        expect(updateDailyRankingLogic[`compareDates`](`9/9`, `10/10`)).toEqual(-1)
    })
})

async function createDammyData() {
    const clipDoc = new ClipDoc()
    const today = new Date()
    for (let index = 1; index < 8; index++) {
        const ended_at = new Date(today.getTime() - index * 24 * 60 * 60 * 1000)
        const started_at = new Date(ended_at.getTime() - 24 * 60 * 60 * 1000)
        const clips = createClipsData(started_at, ended_at)
        clipDoc.clipsMap.set(
            `${started_at.getMonth() + 1}/${started_at.getDate()}`,
            clips
        )
    }
    return clipDoc
}

function createClipsData(started_at?: Date, ended_at?: Date) {
    const display_name = faker.person.fullName()
    const clips: Array<Clip> = [...Array(100).keys()].map(() => {
        const created_at =
            typeof started_at === `undefined` || typeof ended_at === `undefined`
                ? faker.date.past().toISOString()
                : faker.date
                      .between({
                          from: started_at,
                          to: ended_at
                      })
                      .toISOString()

        return {
            embed_url: faker.internet.url(),
            broadcaster_id: faker.string.numeric(10),
            created_at: created_at,
            language: `ja`,
            broadcaster_name: display_name,
            title: faker.lorem.sentence(3),
            thumbnail_url: faker.internet.url(),
            url: faker.internet.url(),
            duration: faker.number.float({ precision: 0.1 }),
            creator_id: faker.string.uuid(),
            creator_name: faker.person.fullName(),
            id: faker.string.uuid(),
            view_count: faker.number.int(),
            is_featured: faker.datatype.boolean(),
            video_id: ``,
            game_id: faker.string.numeric(10),
            profile_image_url: faker.internet.url(),
            broadcaster_follower_num: faker.number.int(),
            broadcaster_login: faker.person.fullName()
        }
    })
    clips.sort((a, b) => {
        if (!a.view_count) {
            return 1
        }
        if (!b.view_count) {
            return -1
        }
        return b.view_count - a.view_count
    })
    return clips
}
