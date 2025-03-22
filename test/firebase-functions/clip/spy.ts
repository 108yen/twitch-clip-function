import { faker } from "@faker-js/faker"

import { RANGE_DATE } from "../../../src/constant"
import { Clip } from "../../../src/models/clip"
import { ClipDoc } from "../../../src/models/clipDoc"
import dayjs from "../../../src/utils/dayjs"
import { getTeamsSpyData } from "../streamer/spy"

export function generatePastClipDoc(id?: string, createdAt?: Date) {
  const result = new ClipDoc()

  const current_year = getJSTDate().getFullYear()
  const created_year = createdAt ? utcToJst(createdAt).getFullYear() : 2016
  const start_year =
    created_year < current_year - RANGE_DATE.PastRangeYears
      ? current_year - RANGE_DATE.PastRangeYears
      : created_year

  for (let year = start_year; year < current_year; year++) {
    const started_at = dayjs().set("year", year).startOf("year")
    const ended_at = dayjs().set("year", year).endOf("year")
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
      const ended_at = dayjs()
      const started_at = ended_at.subtract(days, "day")
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
  const clips: Clip[] = [...Array(100).keys()].map(() => {
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
      game_id: faker.string.numeric(5),
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
    const clips = createClipsData(undefined, started_at, ended_at)
    clipDoc.clipsMap.set(started_at.tz().format("M/D"), clips)
  }
  return clipDoc
}

export function createSummaryClipDoc() {
  const clipDoc = new ClipDoc()
  const currentDate = dayjs()

  clipDoc.clipsMap.set(
    "day",
    createClipsData(undefined, currentDate.subtract(1, "day"), currentDate),
  )
  clipDoc.clipsMap.set(
    "week",
    createClipsData(undefined, currentDate.subtract(1, "week"), currentDate),
  )
  clipDoc.clipsMap.set(
    "month",
    createClipsData(undefined, currentDate.subtract(1, "month"), currentDate),
  )
  clipDoc.clipsMap.set(
    "year",
    createClipsData(undefined, currentDate.subtract(1, "year"), currentDate),
  )
  clipDoc.clipsMap.set("all", createClipsData())

  return clipDoc
}

export function createClipsData(
  id?: string,
  started_at?: dayjs.Dayjs,
  ended_at?: dayjs.Dayjs,
) {
  const display_name = faker.person.fullName()
  const clips: Clip[] = [...Array(100).keys()].map(() => {
    const created_at =
      typeof started_at === "undefined" || typeof ended_at === "undefined"
        ? faker.date.past().toISOString()
        : faker.date
            .between({
              from: started_at.toDate(),
              to: ended_at.toDate(),
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
      game_id: faker.string.numeric(5),
      id: faker.string.uuid(),
      is_featured: faker.datatype.boolean(),
      language: "ja",
      profile_image_url: faker.internet.url(),
      teams: getTeamsSpyData(id).map(
        ({ team_display_name: display_name, team_name: name }) => ({
          display_name,
          name,
        }),
      ),
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
