import { FirestoreDataConverter } from "firebase-admin/firestore";
import { ClipDoc } from "../models/clipDoc";
import { Clip } from "../models/clip";

export const clipDocConverter: FirestoreDataConverter<ClipDoc> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): ClipDoc {
        const data = qds.data();
        return new ClipDoc({
            clipsMap: data as Map<string, Array<Clip>>,
        });
    },
    toFirestore(clipDoc: ClipDoc): FirebaseFirestore.DocumentData {
        return clipDoc.clipsMap.size == 0 ? {} : clipDoc.clipsMap;
    },
}