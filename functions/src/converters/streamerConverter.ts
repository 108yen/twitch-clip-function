import { FirestoreDataConverter } from "@google-cloud/firestore"
import { Streamer } from "../models/streamer"

export const streamerConverter: FirestoreDataConverter<{ streamers: Array<Streamer> }> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): { streamers: Array<Streamer> } {
        const data = qds.data() as { streamers: Array<Streamer> };
        return data;
    },
    toFirestore(doc: { streamers: Array<Streamer> }): FirebaseFirestore.DocumentData {
        return doc;
    },
}