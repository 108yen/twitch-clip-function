import * as functions from "firebase-functions";
import { StreamerRepository } from "../../repositories/streamer";
import { TwitchStreamerApi } from "../../apis/streamer";
import { Streamer } from "../../models/streamer";
import { ClipRepository } from "../../repositories/clip";

export const streamerSelection = functions
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
        const clipRepository = new ClipRepository();
        const fetchStreamers = await streamerRepository.getStreamers();
        const oldStreamerIds = fetchStreamers.map(streamer => streamer.id);
        //get twitch api token
        const twitchStreamerApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        /* ==================================
        Update existing streamer information
        ================================== */
        //get streamers info from twitch api
        const oldStreamers: Array<Streamer> = [];
        //for each streamers
        for (const key in oldStreamerIds) {
            const id = oldStreamerIds[key];
            //get follower num from twitch api
            const followerNum = await twitchStreamerApi
                .getFollowerNum(id);
            oldStreamers.push(new Streamer({
                id: id,
                follower_num: followerNum,
            }))
        }

        /* ==================================
        Find out new streamer
        ================================== */
        const removeTag = [`ASMR`];
        const streams = await twitchStreamerApi.getJpStreams();
        const newStreamerIds = streams
            .filter(stream => {
                if (stream.viewer_count == undefined || stream.user_id == undefined) {
                    return false;
                }
                if (stream.tags?.some(tag => removeTag.includes(tag))) {
                    return false;
                }
                if (stream.viewer_count! > 200 && !oldStreamerIds.includes(stream.user_id!)) {
                    return true;
                }
                return false;
            })
            .map(e => e.user_id!);
        const newStreamers: Array<Streamer> = [];
        //get followe num, for each streamers
        for (const key in newStreamerIds) {
            const id = newStreamerIds[key];
            const followerNum = await twitchStreamerApi
                .getFollowerNum(id);
            newStreamers.push(new Streamer({
                id: id,
                follower_num: followerNum,
            }));
        }
        //Select streamers with top 200 followers
        const selectedStreamers = sortByFollowerNum(oldStreamers.concat(newStreamers))
            .slice(0, 200);
        const selectedStreamerIds = selectedStreamers.map(e => e.id);
        //push to firestore
        const storedStreamers = await twitchStreamerApi.getStreamers(
            selectedStreamerIds,
            true,
        )
        //Re-enter the number of followers
        for (const key in storedStreamers) {
            const streamerInFollowerNum = selectedStreamers
                .find(e => e.id == storedStreamers[key].id);
            storedStreamers[key].follower_num = streamerInFollowerNum?.follower_num;
        }
        await streamerRepository.updateStreamers(sortByFollowerNum(storedStreamers));


        /* ==================================
        Add, delete clipDoc
        ================================== */

        //If it had been deleted this time, delete clipDoc
        if (selectedStreamers.length > 200) {
            functions.logger.info(`delete ${selectedStreamers.length - 200} streamers`);
            for (const key in selectedStreamers.slice(200)) {
                const streamer = selectedStreamers.slice(200)[key];
                if (oldStreamerIds.includes(streamer.id)) {
                    await clipRepository.deleteClipDoc(streamer.id);
                }
            }
        }
        //If it had been added this time, create clipDoc
        //Filter the elements held by both arrays
        const addedStreamerIds = selectedStreamerIds.filter(id => newStreamerIds.indexOf(id) != -1);
        functions.logger.info(`add ${addedStreamerIds.length} streamers`);
        for (const key in addedStreamerIds) {
            const id = addedStreamerIds[key];
            await clipRepository.createClipDoc(id);
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