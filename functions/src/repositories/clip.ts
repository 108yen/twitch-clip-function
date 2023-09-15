import * as functions from "firebase-functions";
import { ClipDoc } from "../models/clipDoc";
import { clipDocRef } from "../firestore-refs/clipRefs";

export class ClipRepository {

    async getClip(clipId: string): Promise<ClipDoc> {
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

    async createClipDoc(clipId: string) {
        try {
            await clipDocRef({ clipId: clipId }).set(new ClipDoc());
        } catch (error) {
            functions.logger.error(`docId:${clipId}の作成に失敗しました: ${error}`);
        }
    }

    async deleteClipDoc(clipId: string) {
        try {
            await clipDocRef({ clipId: clipId }).delete();
        } catch (error) {
            functions.logger.error(`docId:${clipId}の削除に失敗しました: ${error}`);
        }
    }
}