import assert from "assert"

import { Clip } from "../../../../models/clip"
import { ClipDoc } from "../../../../models/clipDoc"
import { ClipRepository } from "../../../../repositories/clip"

export class UpdateDailyRankingLogic {
    clipRepository = new ClipRepository()

    clips: Array<Clip>
    constructor(clipDoc: ClipDoc) {
        this.clips = this.extractDayClips(clipDoc)
    }

    private extractDayClips(clipDoc: ClipDoc): Array<Clip> {
        const clips = clipDoc.clipsMap.get(`day`)
        assert(typeof clips !== `undefined`)
        return clips
    }

    async update() {
        const clipDoc = await this.clipRepository.getClip(`daily`)

        const today = this.getJSTDate()
        const lastDay = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        const key = `${lastDay.getMonth() + 1}/${lastDay.getDate()}`
        if (clipDoc.clipsMap.has(key)) {
            return
        }
        clipDoc.clipsMap.set(key, this.clips)

        if (clipDoc.clipsMap.size > 7) {
            const clipDocKeys = Array.from(clipDoc.clipsMap.keys())
            const delKeys = clipDocKeys.sort(this.compareDates).slice(0, -7)
            for (const key of delKeys) {
                clipDoc.clipsMap.delete(key)
            }
        }

        await this.clipRepository.setClip(`daily`, clipDoc)
    }

    private getJSTDate() {
        const jstFormatter = new Intl.DateTimeFormat(`ja-JP`, { timeZone: `Asia/Tokyo` })
        const jstTime = jstFormatter.format(new Date())
        return new Date(jstTime)
    }

    private compareDates(date1: string, date2: string): number {
        const [month1, day1] = date1.split(`/`).map(Number)
        const [month2, day2] = date2.split(`/`).map(Number)

        if (month1 == 1 && month2 == 12) return 1
        if (month1 == 12 && month2 == 1) return -1
        if (month1 < month2) return -1
        if (month1 > month2) return 1

        if (day1 < day2) return -1
        if (day1 > day2) return 1

        return 0
    }
}
