import { newStreamerLoginsDocRef, streamersDocRef } from "../firestore-refs/streamerRefs";
import { Streamer } from "../models/streamer";
import * as functions from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";

export class StreamerRepository {
    async getStreamers(): Promise<Array<Streamer>> {
        const ds = await streamersDocRef.get();
        if (!ds.data()) {
            throw new Error(`streamersの取得に失敗しました。`);
        }

        return ds.data()!.streamers;
    }

    async updateStreamers(streamers: Array<Streamer>) {
        try {
            await streamersDocRef
                .set({ streamers: streamers }, { merge: true });
        } catch (error) {
            functions.logger.error(`streamerの更新に失敗しました: ${error}`);
        }
    }

    async addStreamers(streamers: Array<Streamer>) {
        try {
            await streamersDocRef.update({
                streamers: FieldValue.arrayUnion(...streamers)
            });
        } catch (error) {
            functions.logger.error(`streamerの追加に失敗しました: ${error}`);
        }
    }

    async deleteLogins(logins: Array<string>) {
        try {
            await newStreamerLoginsDocRef.update({
                logins: FieldValue.arrayRemove(...logins)
            });
        } catch (error) {
            functions.logger.error(`streamers/new/loginsの削除に失敗しました: ${error}`);
        }
    }
}