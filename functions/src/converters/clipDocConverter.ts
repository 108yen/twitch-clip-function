import { FirestoreDataConverter } from "firebase-admin/firestore"

import { Clip } from "../models/clip"
import { ClipDoc } from "../models/clipDoc"
import { Streamer } from "../models/streamer"

interface FirestoreClipDoc {
    streamerInfo?: Streamer
    [key: string]: Array<Clip> | Streamer | undefined
}

export const clipDocConverter: FirestoreDataConverter<ClipDoc> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): ClipDoc {
        const data = qds.data() as FirestoreClipDoc

        const result = new ClipDoc()
        for (const key in data) {
            if (key == `streamerInfo`) {
                const streamerInfo = data[key]
                result.streamerInfo = streamerInfo
            } else {
                const clips = data[key] as Array<Clip>
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
                    id: clip.id,
                    url: clip.url,
                    embed_url: clip.embed_url,
                    broadcaster_id: clip.broadcaster_id,
                    broadcaster_name: clip.broadcaster_name,
                    creator_id: clip.creator_id,
                    creator_name: clip.creator_name,
                    video_id: clip.video_id,
                    game_id: clip.game_id,
                    language: clip.language,
                    title: clip.title,
                    view_count: clip.view_count,
                    created_at: clip.created_at,
                    thumbnail_url: clip.thumbnail_url,
                    duration: clip.duration,
                    vod_offset: clip.vod_offset,
                    is_featured: clip.is_featured,
                    profile_image_url: clip.profile_image_url
                }
            })
        })

        return result
    }
}
