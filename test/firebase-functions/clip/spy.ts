import { faker } from "@faker-js/faker"

import { Clip } from "../../../src/models/clip"
import { ClipDoc } from "../../../src/models/clipDoc"
import dayjs from "../../../src/utils/dayjs"
import { getTeamsSpyData } from "../streamer/spy"

export function generatePastClipDoc(id?: string, createdAt?: Date) {
  const result = new ClipDoc()

  const current_year = getJSTDate().getFullYear()
  const created_year = createdAt ? utcToJst(createdAt).getFullYear() : 2016
  for (let year = created_year; year < current_year; year++) {
    //UTC指定なので-9時間
    const started_at = new Date(year - 1, 11, 31, 15, 0, 0)
    const ended_at = new Date(year, 11, 31, 14, 59, 59)
    const clips = createClipsData(id, started_at, ended_at)
    result.clipsMap.set(year.toString(), clips)
  }

  return result
}

export function generateSummaryClipDoc(id?: string) {
  const result = new ClipDoc()

  //各期間
  const periods: Record<string, number> = {
    all: 0,
    day: 1,
    month: 30,
    week: 7,
    year: 365,
  }
  for (const key in periods) {
    if (Object.prototype.hasOwnProperty.call(periods, key)) {
      const days = periods[key]
      const ended_at = new Date()
      const started_at = new Date(
        ended_at.getTime() - days * 24 * 60 * 60 * 1000,
      )

      const clips = days
        ? createClipsData(id, started_at, ended_at)
        : createClipsData(id)
      result.clipsMap.set(key, clips)
    }
  }
  return result
}

export function generateStreamerClipDoc(id: string, createdAt: Date) {
  const result = new ClipDoc()

  //各期間
  const periodsClipDoc = generateSummaryClipDoc(id)

  //過去
  const pastClipDoc = generatePastClipDoc(id, createdAt)

  //格納
  result.clipDocConcat(periodsClipDoc)
  result.clipDocConcat(pastClipDoc)

  return result
}

export async function getClipsSpyImp(
  broadcaster_id: number,
  started_at?: dayjs.Dayjs,
  ended_at?: dayjs.Dayjs,
) {
  const display_name = faker.person.fullName()
  const clips: Array<Clip> = [...Array(100).keys()].map(() => {
    const created_at =
      typeof started_at === "undefined" || typeof ended_at === "undefined"
        ? faker.date.past().toISOString()
        : faker.date
            .between({
              from: started_at.toDate(),
              to: ended_at.toDate(),
            })
            .toISOString()

    return {
      broadcaster_id: broadcaster_id.toString(),
      broadcaster_name: display_name,
      created_at: created_at,
      creator_id: faker.string.uuid(),
      creator_name: faker.person.fullName(),
      duration: faker.number.float(),
      embed_url: faker.internet.url(),
      game_id: faker.string.numeric(10),
      id: faker.string.uuid(),
      is_featured: faker.datatype.boolean(),
      language: "ja",
      thumbnail_url: faker.internet.url(),
      title: faker.lorem.sentence(3),
      url: faker.internet.url(),
      video_id: "",
      view_count: faker.number.int(),
    }
  })
  return clips
}

export async function createDailyDummyData(dayAfter: number) {
  const clipDoc = new ClipDoc()
  const today = dayjs()
  for (let index = dayAfter; index < dayAfter + 7; index++) {
    const ended_at = today.subtract(index, "day")
    const started_at = ended_at.subtract(1, "day")
    const clips = createClipsData(
      undefined,
      started_at.toDate(),
      ended_at.toDate(),
    )
    clipDoc.clipsMap.set(started_at.tz().format("M/D"), clips)
  }
  return clipDoc
}

export function createSummaryClipDoc() {
  const clipDoc = new ClipDoc()
  const currentDate = new Date()
  const dayAfter = (day: number) => {
    return new Date(currentDate.getTime() - 86400000 * day)
  }

  clipDoc.clipsMap.set(
    "day",
    createClipsData(undefined, dayAfter(1), currentDate),
  )
  clipDoc.clipsMap.set(
    "week",
    createClipsData(undefined, dayAfter(7), currentDate),
  )
  clipDoc.clipsMap.set(
    "month",
    createClipsData(undefined, dayAfter(30), currentDate),
  )
  clipDoc.clipsMap.set(
    "year",
    createClipsData(undefined, dayAfter(365), currentDate),
  )
  clipDoc.clipsMap.set("all", createClipsData())

  return clipDoc
}

export function createClipsData(
  id?: string,
  started_at?: Date,
  ended_at?: Date,
) {
  const display_name = faker.person.fullName()
  const clips: Array<Clip> = [...Array(100).keys()].map(() => {
    const created_at =
      typeof started_at === "undefined" || typeof ended_at === "undefined"
        ? faker.date.past().toISOString()
        : faker.date
            .between({
              from: started_at,
              to: ended_at,
            })
            .toISOString()

    id ??= faker.string.numeric(10)
    const broadcaster_login = faker.person.fullName()

    return {
      broadcaster_follower_num: faker.number.int(),
      broadcaster_id: id,
      broadcaster_login,
      broadcaster_name: display_name,
      created_at: created_at,
      creator_id: faker.string.uuid(),
      creator_name: faker.person.fullName(),
      duration: faker.number.float(),
      embed_url: faker.internet.url(),
      game_id: faker.string.numeric(10),
      id: faker.string.uuid(),
      is_featured: faker.datatype.boolean(),
      language: "ja",
      profile_image_url: faker.internet.url(),
      teams: getTeamsSpyData(id, display_name, broadcaster_login),
      thumbnail_url: faker.internet.url(),
      title: faker.lorem.sentence(3),
      url: faker.internet.url(),
      video_id: "",
      view_count: faker.number.int(),
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
  return utcToJst(new Date())
}

function utcToJst(date: Date) {
  const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
  })
  const jstTime = jstFormatter.format(date)
  return new Date(jstTime)
}
