import { faker } from "@faker-js/faker"

import { Clip } from "../../../src/models/clip"

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
