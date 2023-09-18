import { FirestoreDataConverter } from "firebase-admin/firestore"

import { Clip } from "../models/clip"
import { ClipDoc } from "../models/clipDoc"

export const clipDocConverter: FirestoreDataConverter<ClipDoc> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): ClipDoc {
        const data = qds.data()

        const result = new ClipDoc()
        for (const i in data) {
            const clips: Array<Clip> = []
            for (const j in data[i]) {
                const element = data[i][j] as Clip
                clips.push(element)
            }
            result.clipsMap.set(i, clips)
        }
        return result
    },
    toFirestore(clipDoc: ClipDoc): FirebaseFirestore.DocumentData {
        const clipsObj = Object.fromEntries(clipDoc.clipsMap.entries())
        return clipsObj
    }
}
