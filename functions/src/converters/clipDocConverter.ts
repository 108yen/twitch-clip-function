import { FirestoreDataConverter } from "firebase-admin/firestore";
import { ClipDoc } from "../models/clipDoc";

export const clipDocConverter: FirestoreDataConverter<ClipDoc> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): ClipDoc{
        const data = qds.data() as ClipDoc;
        return data;
    },
    toFirestore(clipDoc: ClipDoc): FirebaseFirestore.DocumentData{
        return clipDoc;
    },
}