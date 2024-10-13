import { Streamer } from "../models/streamer"

export const streamerConverter = {
  fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): {
    streamers: Array<Streamer>
  } {
    const data = qds.data() as { streamers: Array<Streamer> }
    return data
  },
  toFirestore(doc: {
    streamers: Array<Streamer>
  }): FirebaseFirestore.DocumentData {
    return {
      streamers: doc.streamers.map((e) => {
        return {
          broadcaster_type: e.broadcaster_type,
          created_at: e.created_at,
          description: e.description,
          display_name: e.display_name,
          follower_num: e.follower_num,
          id: e.id,
          login: e.login,
          offline_image_url: e.offline_image_url,
          profile_image_url: e.profile_image_url,
          type: e.type,
          view_count: e.view_count,
        }
      }),
    }
  },
}
