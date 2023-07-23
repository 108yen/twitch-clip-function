import * as functions from "firebase-functions";
import { StreamerRepository } from "../../repositories/streamer";
import { streamersDocRef } from "../../firestore-refs/streamerRefs";
import { Streamer } from "../../models/streamer";
import { getToken } from "../../repositories/token";


//update streamer info every wed
export const updateStreamer = functions
    .region(`asia-northeast1`)
    .runWith({
        secrets: [
            `TWITCH_CLIENT_ID`,
            `TWITCH_CLIENT_SECRET`,
        ],
    })
    .pubsub.schedule(`0 21 * * 3`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const streamerRepository = new StreamerRepository();
        const fetchStreamers = await streamerRepository
            .fetchFirestoreStreamers();
        const streamerIds = fetchStreamers.map(streamer => streamer.id);
        //get twitch api token
        const twitchToken = await getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        //get streamers info from twitch api
        let streamers = await streamerRepository.fetchTwitchStreamers(
            streamerIds,
            true,
            process.env.TWITCH_CLIENT_ID!,
            twitchToken,
        );
        //for each streamers
        for (const key in streamers) {
            //get follower num from twitch api
            const followerNum = await streamerRepository.fetchFollowerNum(
                streamers[key].id,
                process.env.TWITCH_CLIENT_ID!,
                twitchToken,
            );
            streamers[key].follower_num = followerNum;
        }
        //sort by follower num
        streamers = sortByFollowerNum(streamers);
        try {
            await streamersDocRef.update({
                streamers: streamers
            });
        } catch (error) {
            functions.logger.error(`streamerの更新に失敗しました: ${error}`);
        }

    });

function sortByFollowerNum(streamers: Array<Streamer>) {
    return streamers
        .sort((a, b) => {
            if (b.follower_num == undefined) {
                return -1;
            }
            if (a.follower_num == undefined) {
                return 1;
            }
            return b.follower_num - a.follower_num;
        });
}