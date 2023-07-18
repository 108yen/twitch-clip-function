import { streamersDocRef } from "../firestore-refs/streamerRefs";
import { Streamer } from "../models/streamer";

export class StreamerRepository {
    async fetchStreamers(): Promise<Array<Streamer> | undefined> {
        const ds = await streamersDocRef.get();
        return ds.data();
    }
}