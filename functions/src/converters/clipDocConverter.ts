import { FirestoreDataConverter } from "firebase-admin/firestore";
import { ClipDoc } from "../models/clipDoc";

export const clipDocConverter: FirestoreDataConverter<ClipDoc> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): ClipDoc {
        const data = qds.data();
        return new ClipDoc({
            day: data?.day,
            week: data?.week,
            month: data?.month,
            year: data?.year,
        });
    },
    toFirestore(clipDoc: ClipDoc): FirebaseFirestore.DocumentData {
        return {
            day: clipDoc.day,
            week: clipDoc.week,
            month: clipDoc.month,
            year: clipDoc.year,
        };
    },
}