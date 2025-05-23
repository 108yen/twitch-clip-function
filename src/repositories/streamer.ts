import assert from "assert"
import { FieldValue } from "firebase-admin/firestore"
import { streamersDocRef } from "../firestore-refs/streamerRefs"
import { Streamer } from "../models/streamer"

export class StreamerRepository {
  async addStreamers(streamers: Streamer[]) {
    await streamersDocRef
      .update({
        streamers: FieldValue.arrayUnion(...streamers),
      })
      .catch((error) => {
        console.error(
          `StreamerRepository/addStreamers/streamersDocRef.update(): ${error}`,
        )
        throw new Error(error)
      })
  }

  batchUpdateStreamers(
    streamers: Streamer[],
    batch: FirebaseFirestore.WriteBatch,
  ) {
    batch.set(streamersDocRef, { streamers: streamers }, { merge: true })
  }

  async getStreamers(): Promise<Streamer[]> {
    const ds = await streamersDocRef.get().catch((error) => {
      console.error(
        `StreamerRepository/getStreamers/streamersDocRef.get(): ${error}`,
      )
      throw new Error(error)
    })
    const streamers = ds?.data()?.streamers
    assert(
      typeof streamers !== "undefined",
      new Error("StreamerRepository/getStreamers: ds.data() is undefined"),
    )

    return streamers
  }

  async updateStreamers(streamers: Streamer[]) {
    await streamersDocRef
      .set({ streamers: streamers }, { merge: true })
      .catch((error) => {
        console.error(
          `StreamerRepository/updateStreamers/streamersDocRef.set(): ${error}`,
        )
        throw new Error(error)
      })
  }
}
