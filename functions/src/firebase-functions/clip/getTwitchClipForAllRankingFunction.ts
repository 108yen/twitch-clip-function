import * as functions from "firebase-functions";
import { ClipDoc } from "../../models/clipDoc";
import { ClipRepository } from "../../repositories/clip";
import { StreamerRepository } from "../../repositories/streamer";
import { TwitchClipApi } from "../../apis/clip";
import { Clip } from "../../models/clip";

//get twitch clip every month 1st and 16 for all ranking
export const getTwitchClipForAllRankingFunction = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 300,
        secrets: [
            `TWITCH_CLIENT_ID`,
            `TWITCH_CLIENT_SECRET`,
        ],
    })
    .pubsub.schedule(`0 1 1,16 * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        //repository
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        //get streamers info from firestore
        const streamers = await streamerRepository
            .getStreamers();

        //get twitch api token
        const twitchClipApi = await TwitchClipApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        //for summary ranking
        const summary = new ClipDoc();
        //get for each streamer's clips
        for (const key in streamers) {
            const clips = await twitchClipApi.getClips(
                parseInt(streamers[key].id),
            );
            const clipDoc = new ClipDoc({
                clipsMap: new Map<string, Array<Clip>>([
                    [`all`, clips],
                ])
            });
            //post each streamer clips to firestore
            await clipRepository.updateClip(streamers[key].id, clipDoc);
            //push to summary
            summary.clipDocConcat(clipDoc);
        }

        //make summary ranking
        summary.sort();
        //post summary clips to firestore
        await clipRepository.updateClip(`summary`, summary);
    });
