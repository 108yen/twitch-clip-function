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
      result[key] = clips.map((clip) => {
        return {
          broadcaster_follower_num: clip.broadcaster_follower_num,
          broadcaster_id: clip.broadcaster_id,
          broadcaster_login: clip.broadcaster_login,
          broadcaster_name: clip.broadcaster_name,
          created_at: clip.created_at,
          creator_id: clip.creator_id,
          creator_name: clip.creator_name,
          duration: clip.duration,
          embed_url: clip.embed_url,
          game_id: clip.game_id,
          id: clip.id,
          is_featured: clip.is_featured,
          language: clip.language,
          profile_image_url: clip.profile_image_url,
          thumbnail_url: clip.thumbnail_url,
          title: clip.title,
          url: clip.url,
          video_id: clip.video_id,
          view_count: clip.view_count,
          vod_offset: clip.vod_offset,
        }
      })
    })

    return result
  },
}
