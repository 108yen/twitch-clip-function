import { FieldValue } from "firebase-admin/firestore";
import * as functions from "firebase-functions";
import { getToken } from "../../repositories/token";
import { StreamerRepository } from "../../repositories/streamer";
import { newStreamerLoginsDocRef, streamersDocRef } from "../../firestore-refs/streamerRefs";
import { newStreamerLoginsConverter } from "../../converters/newStreamerLoginsConverter";
import { clipDocRef } from "../../firestore-refs/clipRefs";

//add new streamer
export const onAddStreamer = functions
    .region("asia-northeast1")
    .runWith({
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .firestore.document("/streamers/new")
    .onUpdate(async (change) => {
        const streamerRepository = new StreamerRepository();
        //get change
        const fetchfromfirestore = newStreamerLoginsConverter.fromFirestore(change.after);
        //if exist new
        if (fetchfromfirestore.logins.length != 0) {
            //get twitch api token
            const twitchToken = await getToken(
                process.env.TWITCH_CLIENT_ID!,
                process.env.TWITCH_CLIENT_SECRET!
            );
            //get streamers info from twitch api
            const streamers = await streamerRepository.fetchTwitchStreamers(
                fetchfromfirestore.logins,
                false,
                process.env.TWITCH_CLIENT_ID!,
                twitchToken,
            );
            //post streamers to firestore
            //todo: check aleady exist
            try {
                await streamersDocRef.update({
                    streamers: FieldValue.arrayUnion(...streamers)
                });
            } catch (error) {
                functions.logger.error(`streamerの追加に失敗しました: ${error}`);
            }
            //create clip docs
            for (const key in streamers) {
                try {
                    await clipDocRef({ clipId: streamers[key].id }).set({});
                } catch (error) {
                    functions.logger.error(`docId:${streamers[key].id}の作成に失敗しました: ${error}`);
                }
            }

            //delete login from new doc;
            try {
                await newStreamerLoginsDocRef.update({
                    logins: FieldValue.arrayRemove(...fetchfromfirestore.logins)
                });
            } catch (error) {
                functions.logger.error(`streamers/new/loginsの削除に失敗しました: ${error}`);
            }
        }

    });