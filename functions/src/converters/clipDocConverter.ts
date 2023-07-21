import { FirestoreDataConverter } from "firebase-admin/firestore";
import { ClipDoc } from "../models/clipDoc";
import { Clip } from "../models/clip";

export const clipDocConverter: FirestoreDataConverter<ClipDoc> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): ClipDoc {
        const data = qds.data();
        return new ClipDoc({
            // day: data?.day,
            // week: data?.week,
            // month: data?.month,
            // year: data?.year,
            // all: data?.all,
            clipsMap: data as Map<string, Array<Clip>>,
        });
    },
    toFirestore(clipDoc: ClipDoc): FirebaseFirestore.DocumentData {
        // let result: FirebaseFirestore.DocumentData = {
        //     day: clipDoc.day,
        //     week: clipDoc.week,
        //     month: clipDoc.month,
        //     year: clipDoc.year,
        //     all: clipDoc.all,
        // }
        // result = { ...result, ...clipDoc.past_summary };

        // return result;
        return clipDoc.clipsMap;
    },
}