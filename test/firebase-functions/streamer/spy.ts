import { faker } from "@faker-js/faker"

import { Streamer } from "../../../src/models/streamer"

export function getStreamersSpy(n: number) {
  const streamers: Array<Streamer> = [...Array(n).keys()].map(
    (value, index) => {
      return {
        broadcaster_type: "",
        created_at: faker.date.past().toISOString(),
        description: "test user",
        display_name: faker.person.fullName(),
        follower_num: index,
        id: faker.string.uuid(),
        login: faker.person.firstName(),
        offline_image_url: faker.internet.url(),
        profile_image_url: faker.internet.url(),
        type: "",
        view_count: faker.number.int(),
      }
    },
  )
  return streamers.slice().reverse()
}

interface TeamApiReturn {
  background_image_url?: string
  banner?: string
  broadcaster_id?: string
  broadcaster_login?: string
  broadcaster_name?: string
  created_at?: string
  id?: string
  info?: string
  team_display_name?: string
  team_name?: string
  thumbnail_url?: string
  updated_at?: string
}

export function getTeamsSpyData(id: string, name?: string, login?: string) {
  const length = faker.number.int({ max: 3, min: 0 })

  const teams: TeamApiReturn[] = Array(length)
    .fill(0)
    .map(() => ({
      background_image_url: faker.internet.url(),
      banner: faker.internet.url(),
      broadcaster_id: id,
      broadcaster_login: login,
      broadcaster_name: name,
      created_at: faker.date.past().toISOString(),
      id: faker.string.uuid(),
      info: faker.commerce.productDescription(),
      team_display_name: faker.company.name(),
      team_name: faker.company.name(),
      thumbnail_url: faker.internet.url(),
      updated_at: faker.date.past().toISOString(),
    }))

  return teams
}
