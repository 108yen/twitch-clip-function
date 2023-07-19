import { FieldValue } from "firebase-admin/firestore";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getToken } from "../../repositories/token";
import { StreamerRepository } from "../../repositories/streamer";
import { streamersDocRef } from "../../firestore-refs/streamerRefs";

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
        const fetchfromfirestore: { logins: Array<string> } = change.after.data() as { logins: Array<string> };
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
            await db.collection("streamers").doc("streamers").update({
                streamers: FieldValue.arrayUnion(...streamers)
            });
            try {
                await streamersDocRef.update({
                    streamers: FieldValue.arrayUnion(...streamers)
                });
            } catch (error) {

            }
            //create clip docs
            for (const key in streamers) {
                await db.collection("clips").doc(streamers[key].id).set({});
            }

            //delete login from new doc
            await db.collection("streamers").doc("new").update({
                logins: FieldValue.arrayRemove(...fetchfromfirestore.logins)
            });
        }

    });