import { Clip } from "../models/clip"
import { ClipDoc } from "../models/clipDoc"
import { Streamer } from "../models/streamer"

interface FirestoreClipDoc {
  [key: string]: Clip[] | Streamer | undefined
  streamerInfo?: Streamer
}

export const clipDocConverter = {
  fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): ClipDoc {
    const data = qds.data() as FirestoreClipDoc

    const result = new ClipDoc()
    for (const key in data) {
      if (key == "streamerInfo") {
        const streamerInfo = data[key]
        result.streamerInfo = streamerInfo
      } else {
        const clips = data[key] as Clip[]
        result.clipsMap.set(key, clips)
      }
    }
    return result
  },
  toFirestore(clipDoc: ClipDoc): FirebaseFirestore.DocumentData {
    const result: FirestoreClipDoc = { streamerInfo: clipDoc.streamerInfo }

    clipDoc.clipsMap.forEach((clips, key) => {
      result[key] = clips.map((clip) => ({
        ...clip,
      }))
    })

    return result
  },
}
