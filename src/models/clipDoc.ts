import { Clip } from "./clip"
import { Streamer } from "./streamer"

export class ClipDoc {
  private CLIP_NUM = 100

  clipsMap: Map<string, Array<Clip>> = new Map<string, Array<Clip>>()
  streamerInfo?: Streamer

  constructor(partial?: Partial<ClipDoc>) {
    Object.assign(this, partial)
  }

  private sortByViewCount(clips: Array<Clip>) {
    return clips
      .sort((a, b) => {
        if (!a.view_count) {
          return 1
        }
        if (!b.view_count) {
          return -1
        }
        return b.view_count - a.view_count
      })
      .slice(0, this.CLIP_NUM)
  }

  clipDocConcat(clipDoc: ClipDoc) {
    for (const [key, value] of clipDoc.clipsMap) {
      if (value) {
        this.clipsMap.set(key, value.concat(this.clipsMap.get(key) ?? []))
      }
    }
  }

  sort() {
    for (const [key, value] of this.clipsMap) {
      if (value) {
        this.clipsMap.set(key, this.sortByViewCount(value))
      }
    }
  }
}
