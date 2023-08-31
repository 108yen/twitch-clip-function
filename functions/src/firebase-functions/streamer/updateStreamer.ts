import * as functions from "firebase-functions";
import { StreamerRepository } from "../../repositories/streamer";
import { Streamer } from "../../models/streamer";
import { TwitchStreamerApi } from "~/src/apis/streamer";


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
        const fetchStreamers = await streamerRepository.getStreamers();
        const streamerIds = fetchStreamers.map(streamer => streamer.id);
        //get twitch api token
        const twitchStreamerApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        //get streamers info from twitch api
        const streamers = await twitchStreamerApi.getStreamers(
            streamerIds,
            true,
        )
        //for each streamers
        for (const key in streamers) {
            //get follower num from twitch api
            const followerNum = await twitchStreamerApi
                .getFollowerNum(streamers[key].id);
            streamers[key].follower_num = followerNum;
        }
        //sort by follower num
        await streamerRepository.updateStreamers(sortByFollowerNum(streamers));

        if (fetchStreamers.length == streamers.length) {
            functions.logger.info(`update ${streamers.length} streamers info`);
        } else {
            const diff = fetchStreamers.filter(i => streamers.indexOf(i) == -1);
            functions.logger.info(`difference (may be baned): ${diff.map(e => e.display_name)}`);
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