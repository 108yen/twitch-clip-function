import * as functions from "firebase-functions";
import { ClipDoc } from "../models/clipDoc";
import { clipDocRef } from "../firestore-refs/clipRefs";

export class ClipRepository {

    async getClip(clipId: string): Promise<ClipDoc> {
        const ds = await clipDocRef({ clipId: clipId })
            .get()
            .catch((error) => {
                functions.logger.error(`ClipRepository/getClip/clipDocRef.get(): ${error}`);
                throw new Error(error);
            });
        if (!ds?.data()) {
            throw new Error(`ClipRepository/getClip: ds.data is undefind, documentId: ${clipId}`);
        }

        return ds.data()!;
    }

    async updateClip(clipId: string, clipDoc: ClipDoc) {
        await clipDocRef({ clipId: clipId })
            .set(clipDoc, { merge: true })
            .catch((error) => {
                functions.logger.error(`ClipRepository/updateClip/clipDocRef.set():${error}`)
                throw new Error(error);
            });
    }

    batchUpdateClip(clipId: string, clipDoc: ClipDoc, batch: FirebaseFirestore.WriteBatch) {
        batch.set(clipDocRef({ clipId: clipId }), clipDoc, { merge: true });
    }

    async createClipDoc(clipId: string) {
        await clipDocRef({ clipId: clipId })
            .set(new ClipDoc())
            .catch((error) => {
                functions.logger.error(`ClipRepository/createClipDoc/clipDocRef.set():${error}`)
                throw new Error(error);
            });
    }

    batchCreateClipDoc(clipId: string, batch: FirebaseFirestore.WriteBatch) {
        batch.set(clipDocRef({ clipId: clipId }), new ClipDoc());
    }

    async deleteClipDoc(clipId: string) {
        await clipDocRef({ clipId: clipId })
            .delete()
            .catch((error) => {
                functions.logger.error(`ClipRepository/createClipDoc/clipDocRef.delete():${error}`)
                throw new Error(error);
            });
    }

    batchDeleteClipDoc(clipId: string, batch: FirebaseFirestore.WriteBatch) {
        batch.delete(clipDocRef({ clipId: clipId }));
    }
}