import { faker } from "@faker-js/faker"

import { Clip } from "../../../../../src/models/clip"
import { ClipDoc } from "../../../../../src/models/clipDoc"
import { ClipRepository } from "../../../../../src/repositories/clip"
import { clipElementCheck, clipOrderCheck } from "../../checkFunctions"

describe(`UpdateDailyRankingLogicのテスト`, () => {
    const clipRepository = new ClipRepository()
    beforeAll(async () => {
        const clipDoc = createDammyData()
        await clipRepository.updateClip(`daily`, clipDoc)
    })
    afterAll(async () => {
        await clipRepository.deleteClipDoc(`daily`)
    })
    afterEach(() => jest.restoreAllMocks())
    test(`ダミーデータがちゃんと作成出来ているかの確認`, async () => {
        const clipDoc = await clipRepository.getClip(`daily`)
        for (const [, clips] of clipDoc.clipsMap) {
            clipOrderCheck(clips)
            clipElementCheck(clips)
        }
    })
    test.todo(`0じの実行だった場合、clipDocを受け取ってdayランキングだけ出す`)
    test.todo(`firestoreの今のdayランキングをとって入れなおす`)
    test.todo(`7日から漏れたやつは消す`)
})

function createDammyData() {
    const clipDoc = new ClipDoc()
    const today = new Date()
    for (let index = 0; index < 7; index++) {
        const ended_at = new Date(today.getTime() - index * 24 * 60 * 60 * 1000)
        const started_at = new Date(ended_at.getTime() - 24 * 60 * 60 * 1000)
        const clips = createClipsData(started_at, ended_at)
        clipDoc.clipsMap.set(
            `${started_at.getMonth() + 1}/${started_at.getDate()}`,
            clips
        )
    }
    clipDoc.sort()
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
    return clips
}
