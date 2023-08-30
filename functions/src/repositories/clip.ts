import * as functions from "firebase-functions";
import { ClipDoc } from "../models/clipDoc";
import { clipDocRef } from "../firestore-refs/clipRefs";

export class ClipRepository {

    async fetchClip(clipId: string): Promise<ClipDoc> {
        const ds = await clipDocRef({ clipId: clipId }).get();
        if (!ds.data()) {
            throw new Error(`documentId: ${clipId}のclipの取得に失敗しました。`);
        }

        return ds.data()!;
    }

    async updateClip(clipId: string, clipDoc: ClipDoc) {
        try {
            await clipDocRef({ clipId: clipId })
                .set(clipDoc, { merge: true });
        } catch (error) {
            functions.logger.error(`${clipId}のclip情報の更新に失敗しました: ${error}`);
        }
    }
}