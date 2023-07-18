import { FirestoreDataConverter } from '@google-cloud/firestore'
import { Streamer } from '../models/streamer'

export const streamerConverter: FirestoreDataConverter<Array<Streamer>> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): Array<Streamer> {
        const data = qds.data() as { streamers: Array<Streamer> };
        return data.streamers.map(e => {
            return {
                id: e.id,
                login: e.login ?? "",
                display_name: e.display_name ?? "",
                type: e.type ?? "",
                broadcaster_type: e.broadcaster_type ?? "",
                description: e.description ?? "",
                profile_image_url: e.profile_image_url ?? "",
                offline_image_url: e.offline_image_url ?? "",
                view_count: e.view_count ?? 0,
                created_at: e.created_at ?? "",
                follower_num: e.follower_num,
            }
        })
    },
    toFirestore(streamers: Array<Streamer>): FirebaseFirestore.DocumentData {
        return {
            streamers: streamers.map(streamer => {
                return {
                    id: streamer.id,
                    login: streamer.login ?? "",
                    display_name: streamer.display_name ?? "",
                    type: streamer.type ?? "",
                    broadcaster_type: streamer.broadcaster_type ?? "",
                    description: streamer.description ?? "",
                    profile_image_url: streamer.profile_image_url ?? "",
                    offline_image_url: streamer.offline_image_url ?? "",
                    view_count: streamer.view_count ?? 0,
                    created_at: streamer.created_at ?? "",
                    follower_num: streamer.follower_num,
                }
            })
        }
    }
}