import * as functions from "firebase-functions";
import { ClipDoc } from "../../models/clipDoc";
import { ClipRepository } from "../../repositories/clip";
import { StreamerRepository } from "../../repositories/streamer";
import { TwitchClipApi } from "~/src/apies/clip";

//get twitch clip every day
export const getTwitchClipFunction = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 540,
        secrets: [
            `TWITCH_CLIENT_ID`,
            `TWITCH_CLIENT_SECRET`,
        ],
    })
    .pubsub.schedule(`0 0,6,12,18 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        //repository
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        //get streamers info from firestore
        const streamers = await streamerRepository
            .fetchFirestoreStreamers();
        //get twitch api token
        const twitchClipApi = new TwitchClipApi();
        await twitchClipApi.getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        //for summary ranking
        const summary = new ClipDoc();
        //loop each streamer
        for (const key in streamers) {
            const periods: { [key: string]: number } = {
                day: 1,
                week: 7,
                month: 30,
                year: 365,
            };
            const clipDoc = new ClipDoc();
            for (const periodKey in periods) {
                const period = periods[periodKey];
                const now = new Date(); // get present date
                const daysAgo = new Date(now.getTime() - period * 24 * 60 * 60 * 1000); //days ago
                const clips = await twitchClipApi.getClips(
                    parseInt(streamers[key].id),
                    process.env.TWITCH_CLIENT_ID!,
                    daysAgo,
                    now,
                )              
                clipDoc.clipsMap.set(
                    periodKey,
                    clips,
                );
            }
            //post each streamer clips to firestore
            await clipRepository.updateClip(streamers[key].id, clipDoc);
            //push to summary list
            summary.clipDocConcat(clipDoc);
        }
        //make summary ranking
        summary.sort();

        //post summary clips to firestore
        await clipRepository.updateClip(`summary`, summary);
    });