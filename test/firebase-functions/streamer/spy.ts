import { faker } from "@faker-js/faker"

import { Streamer } from "../../../src/models/streamer"

export function getStreamersSpy(n: number) {
  const streamers: Array<Streamer> = [...Array(n).keys()].map(
    (value, index) => {
      return {
        broadcaster_type: ``,
        created_at: faker.date.past().toISOString(),
        description: `test user`,
        display_name: faker.person.fullName(),
        follower_num: index,
        id: faker.string.uuid(),
        login: faker.person.firstName(),
        offline_image_url: faker.internet.url(),
        profile_image_url: faker.internet.url(),
        type: ``,
        view_count: faker.number.int(),
      }
    },
  )
  return streamers.slice().reverse()
}
