import assert from "assert"

import { Clip } from "../../../../models/clip"
import { ClipDoc } from "../../../../models/clipDoc"
import { ClipRepository } from "../../../../repositories/clip"

export class UpdateDailyRankingLogic {
    clipRepository = new ClipRepository()

    clipDoc: ClipDoc
    constructor(clipDoc: ClipDoc) {
        this.clipDoc = clipDoc
    }

    extractDayClips(): Array<Clip> {
        const clips = this.clipDoc.clipsMap.get(`day`)
        assert(typeof clips !== `undefined`)
        return clips
    }

    async update() {
        const clipDoc = await this.clipRepository.getClip(`daily`)
        const newClips = this.extractDayClips()

        const today = new Date()
        const lastDay = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        clipDoc.clipsMap.set(`${lastDay.getMonth() + 1}/${lastDay.getDate()}`, newClips)

        if (clipDoc.clipsMap.size > 7) {
            const clipDocKeys = Array.from(clipDoc.clipsMap.keys())
            const delKeys = clipDocKeys.sort(this.compareDates).slice(0,-7)
            for (const key of delKeys) {
                clipDoc.clipsMap.delete(key)
            }
        }

        await this.clipRepository.updateClip(`daily`, clipDoc)
    }

    private compareDates(date1: string, date2: string): number {
        const [month1, day1] = date1.split(`/`).map(Number)
        const [month2, day2] = date2.split(`/`).map(Number)

        if (month1 < month2) return -1
        if (month1 > month2) return 1

        if (day1 < day2) return -1
        if (day1 > day2) return 1

        return 0
    }
}
