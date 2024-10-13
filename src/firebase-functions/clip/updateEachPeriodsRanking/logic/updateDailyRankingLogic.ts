import assert from "assert"

import { Clip } from "../../../../models/clip"
import { ClipDoc } from "../../../../models/clipDoc"
import { ClipRepository } from "../../../../repositories/clip"
import dayjs from "../../../../utils/dayjs"

export class UpdateDailyRankingLogic {
  clipRepository = new ClipRepository()

  clips: Array<Clip>
  constructor(clipDoc: ClipDoc) {
    this.clips = this.extractDayClips(clipDoc)
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

  private extractDayClips(clipDoc: ClipDoc): Array<Clip> {
    const clips = clipDoc.clipsMap.get(`day`)
    assert(typeof clips !== `undefined`)
    return clips
  }

  async update() {
    const clipDoc = await this.clipRepository.getClip(`daily`)

    const today = dayjs()
    const yesterday = today.subtract(1, `day`)
    const key = yesterday.tz().format(`M/D`)
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
}
