import { faker } from "@faker-js/faker"

import { Clip } from "../../../src/models/clip"
import { ClipDoc } from "../../../src/models/clipDoc"

export async function getClipsSpyImp(
    broadcaster_id: number,
    started_at?: Date,
    ended_at?: Date
) {
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
            broadcaster_id: broadcaster_id.toString(),
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
            game_id: faker.string.numeric(10)
        }
    })
    return clips
}

export async function createDailyDammyData(dayAfter: number) {
    const clipDoc = new ClipDoc()
    const today = getJSTDate()
    for (let index = dayAfter; index < dayAfter + 7; index++) {
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

export function createClipsData(started_at?: Date, ended_at?: Date) {
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

export function getJSTDate() {
    const jstFormatter = new Intl.DateTimeFormat(`ja-JP`, { timeZone: `Asia/Tokyo` })
    const jstTime = jstFormatter.format(new Date())
    return new Date(jstTime)
}
