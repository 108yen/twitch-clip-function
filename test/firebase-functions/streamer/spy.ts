import { faker } from "@faker-js/faker"

import { Streamer } from "../../../src/models/streamer"

export function getStreamersSpy(n: number) {
    const streamers: Array<Streamer> = [...Array(n).keys()].map((value, index) => {
        return {
            id: faker.string.uuid(),
            login: faker.person.firstName(),
            display_name: faker.person.fullName(),
            type: ``,
            broadcaster_type: ``,
            description: `test user`,
            profile_image_url: faker.internet.url(),
            offline_image_url: faker.internet.url(),
            view_count: faker.number.int(),
            created_at: faker.date.past().toISOString(),
            follower_num: index
        }
    })
    return streamers.slice().reverse()
}
