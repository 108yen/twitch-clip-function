import { FirestoreDataConverter } from "@google-cloud/firestore"
import { Streamer } from "../models/streamer"

export const streamerConverter: FirestoreDataConverter<{ streamers: Array<Streamer> }> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): { streamers: Array<Streamer> } {
        const data = qds.data() as { streamers: Array<Streamer> };
        return data;
    },
    toFirestore(doc: { streamers: Array<Streamer> }): FirebaseFirestore.DocumentData {
        return {
            streamers: doc.streamers.map(e => {
                return {
                    id: e.id,
                    login: e.login,
                    display_name: e.display_name,
                    type: e.type,
                    broadcaster_type: e.broadcaster_type,
                    description: e.description,
                    profile_image_url: e.profile_image_url,
                    offline_image_url: e.offline_image_url,
                    view_count: e.view_count,
                    created_at: e.created_at,
                    follower_num: e.follower_num,
                }
            })
        };
    },
}