import { streamersDocRef } from "../firestore-refs/streamerRefs";
import { Streamer } from "../models/streamer";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

export class StreamerRepository {
    async getStreamers(): Promise<Array<Streamer>> {
        const ds = await streamersDocRef
            .get()
            .catch((error) => {
                functions.logger.error(`StreamerRepository/getStreamers/streamersDocRef.get(): ${error}`);
                throw new Error(error);
            });
        if (!ds?.data()) {
            throw new Error(`StreamerRepository/getStreamers: ds.data() is undefind`);
        }

        return ds.data()!.streamers;
    }

    async updateStreamers(streamers: Array<Streamer>) {
        await streamersDocRef
            .set({ streamers: streamers }, { merge: true })
            .catch((error) => {
                functions.logger.error(`StreamerRepository/updateStreamers/streamersDocRef.set(): ${error}`);
                throw new Error(error);
            });
    }

    batchUpdateStreamers(streamers: Array<Streamer>, batch: FirebaseFirestore.WriteBatch) {
        batch.set(streamersDocRef, { streamers: streamers }, { merge: true })
    }

    async addStreamers(streamers: Array<Streamer>) {
        await streamersDocRef
            .update({
                streamers: FieldValue.arrayUnion(...streamers)
            })
            .catch((error) => {
                functions.logger.error(`StreamerRepository/addStreamers/streamersDocRef.update(): ${error}`);
                throw new Error(error);
            });
    }
}