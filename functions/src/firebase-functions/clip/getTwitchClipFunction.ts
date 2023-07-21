import * as functions from "firebase-functions";
import { clipDocRef } from "~/src/firestore-refs/clipRefs";
import { ClipDoc } from "~/src/models/clipDoc";
import { ClipRepository } from "~/src/repositories/clip";
import { StreamerRepository } from "~/src/repositories/streamer";
import { getToken } from "~/src/repositories/token";

//get twitch clip every day
export const getTwitchClipFunction = functions
    .region("asia-northeast1")
    .runWith({
        timeoutSeconds: 300,
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .pubsub.schedule("0 0,6,12,18 * * *")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        //repository
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        //get streamers info from firestore
        const fetchStreamers = await streamerRepository
            .fetchFirestoreStreamers();
        const streamerIds = fetchStreamers.map(streamer => streamer.id);
        //get twitch api token
        const twitchToken = await getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        //for summary ranking
        let summary = new ClipDoc();
        //loop each streamer
        for (const key in streamerIds) {
            const clips = await clipRepository.getEachPeriodClips(
                streamerIds[key],
                process.env.TWITCH_CLIENT_ID!,
                twitchToken,
            )
            //post each streamer clips to firestore
            try {
                await clipDocRef({ clipId: streamerIds[key] }).update(clips);
            } catch (error) {
                functions.logger.error(`documentID: ${streamerIds[key]}のclip情報の更新に失敗しました: ${error}`);
            }
            //push to summary list
            summary.clipDocConcat(clips);
        }
        //make summary ranking
        summary.sort();

        //post summary clips to firestore
        try {
            await clipDocRef({ clipId: "summary" }).update(summary);
        } catch (error) {
            functions.logger.error(`summaryのclip情報の更新に失敗しました: ${error}`);
        }
    });