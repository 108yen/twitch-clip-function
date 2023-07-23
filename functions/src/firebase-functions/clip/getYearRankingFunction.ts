import * as functions from "firebase-functions";
import { clipDocRef } from "../../../src/firestore-refs/clipRefs";
import { ClipDoc } from "../../../src/models/clipDoc";
import { ClipRepository } from "../../../src/repositories/clip";
import { StreamerRepository } from "../../../src/repositories/streamer";
import { getToken } from "../../../src/repositories/token";

//get twitch clip ranking for each year
export const getYearRankingFunction = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 300,
        secrets: [
            `TWITCH_CLIENT_ID`,
            `TWITCH_CLIENT_SECRET`,
        ],
    })
    .pubsub.schedule(`0 1 4 * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(
        async () => {
            //repository
            const streamerRepository = new StreamerRepository();
            const clipRepository = new ClipRepository();
            //get streamers info from firestore
            const streamers = await streamerRepository
                .fetchFirestoreStreamers();
            //get twitch api token
            const twitchToken = await getToken(
                process.env.TWITCH_CLIENT_ID!,
                process.env.TWITCH_CLIENT_SECRET!
            );
            //for summary ranking
            const summary = new ClipDoc();
            //get for each streamer's clips
            for (const key in streamers) {
                const clipDoc = await clipRepository.getYearRankingForEachStreamer(
                    streamers[key],
                    process.env.TWITCH_CLIENT_ID!,
                    twitchToken,
                )
                if (clipDoc != undefined) {
                    //push to firestore
                    try {
                        await clipDocRef({ clipId: streamers[key].id })
                            .set(clipDoc, { merge: true });
                    } catch (error) {
                        functions.logger.error(`${streamers[key].display_name}のクリップの更新に失敗しました: ${error}`);
                    }
                    //for each year, push to summary
                    summary.clipDocConcat(clipDoc);
                    summary.sort();
                }
            }
            //push summary to firestore
            try {
                await clipDocRef({ clipId: `past_summary` })
                    .set(summary, { merge: true });
            } catch (error) {
                functions.logger.error(`past_summaryのクリップの更新に失敗しました: ${error}`);
            }
        }
    );