import { FirestoreDataConverter } from "firebase-admin/firestore"

import { Clip } from "../models/clip"
import { ClipDoc } from "../models/clipDoc"

export const clipDocConverter: FirestoreDataConverter<ClipDoc> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): ClipDoc {
        const data = qds.data()

        const result = new ClipDoc()
        for (const i in data) {
            const clips: Array<Clip> = []
            for (const j in data[i]) {
                const element = data[i][j] as Clip
                clips.push(element)
            }
            result.clipsMap.set(i, clips)
        }
        return result
    },
    toFirestore(clipDoc: ClipDoc): FirebaseFirestore.DocumentData {
        const result: { [key: string]: Array<Clip> } = {}
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
