import { faker } from "@faker-js/faker"

import { Clip } from "../../../src/models/clip"
import { ClipDoc } from "../../../src/models/clipDoc"
import dayjs from "dayjs"

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
    const periods: { [key: string]: number } = {
        day: 1,
        week: 7,
        month: 30,
        year: 365,
        all: 0
    }
    for (const key in periods) {
        if (Object.prototype.hasOwnProperty.call(periods, key)) {
            const days = periods[key]
            const ended_at = new Date()
            const started_at = new Date(ended_at.getTime() - days * 24 * 60 * 60 * 1000)

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
    ended_at?: dayjs.Dayjs
) {
    const display_name = faker.person.fullName()
    const clips: Array<Clip> = [...Array(100).keys()].map(() => {
        const created_at =
            typeof started_at === `undefined` || typeof ended_at === `undefined`
                ? faker.date.past().toISOString()
                : faker.date
                      .between({
                          from: started_at.toDate(),
                          to: ended_at.toDate()
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
        const clips = createClipsData(undefined, started_at, ended_at)
        clipDoc.clipsMap.set(
            `${started_at.getMonth() + 1}/${started_at.getDate()}`,
            clips
        )
    }
    return clipDoc
}

export function createSummaryClipDoc() {
    const clipDoc = new ClipDoc()
    const currentDate = new Date()
    const dayAfter = (day: number) => {
        return new Date(currentDate.getTime() - 86400000 * day)
    }

    clipDoc.clipsMap.set(`day`, createClipsData(undefined, dayAfter(1), currentDate))
    clipDoc.clipsMap.set(`week`, createClipsData(undefined, dayAfter(7), currentDate))
    clipDoc.clipsMap.set(`month`, createClipsData(undefined, dayAfter(30), currentDate))
    clipDoc.clipsMap.set(`year`, createClipsData(undefined, dayAfter(365), currentDate))
    clipDoc.clipsMap.set(`all`, createClipsData())

    return clipDoc
}

export function createClipsData(id?: string, started_at?: Date, ended_at?: Date) {
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
            broadcaster_id: id ?? faker.string.numeric(10),
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
    return utcToJst(new Date())
}

function utcToJst(date: Date) {
    const jstFormatter = new Intl.DateTimeFormat(`ja-JP`, { timeZone: `Asia/Tokyo` })
    const jstTime = jstFormatter.format(date)
    return new Date(jstTime)
}
