import * as functions from "firebase-functions";
import { StreamerRepository } from "../../repositories/streamer";
import { TwitchStreamerApi } from "../../apis/streamer";
import { Streamer } from "../../models/streamer";
import { ClipRepository } from "../../repositories/clip";

export const streamerSelection = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 300,
        secrets: [
            `TWITCH_CLIENT_ID`,
            `TWITCH_CLIENT_SECRET`,
        ],
    })
    .pubsub.schedule(`30 5,11,17,23 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const findoutNewStreamer = await FindOutNewStreamer.init();

        /* ==================================
        Update existing streamer information
        ================================== */
        const oldStreamers = await findoutNewStreamer.getOldStreamer();
        const oldStreamerIds = oldStreamers.map(e => e.id);

        /* ==================================
        Find out new streamer
        ================================== */
        const stream = await findoutNewStreamer.getJpLiveStreaming();
        const newStreamerIds = findoutNewStreamer.filterStreams(stream, oldStreamerIds);
        const newStreamers = await findoutNewStreamer.getNewStreamerFollower(newStreamerIds);
        const { selectedStreamers, removedStreamerIds, addedStreamerIds } = findoutNewStreamer
            .concatAndFilter(oldStreamers, newStreamers);
        const storedStreamers = await findoutNewStreamer.updateStreamerInfo(selectedStreamers);


        /* ==================================
        Add, delete clipDoc
        ================================== */
        await findoutNewStreamer.updateFirestore(storedStreamers, removedStreamerIds, addedStreamerIds);

        functions.logger.info(`add ${addedStreamerIds.length}, delete ${removedStreamerIds.length} (total:${storedStreamers.length})`);
    });

class FindOutNewStreamer {
    streamerRepository = new StreamerRepository();
    clipRepository = new ClipRepository();
    twitchStreamerApi: TwitchStreamerApi;
    constructor(twitchStreamerApi: TwitchStreamerApi) {
        this.twitchStreamerApi = twitchStreamerApi;
    }

    public static async init() {
        const twitchStreamerApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        return new FindOutNewStreamer(twitchStreamerApi);
    }

    async getOldStreamer(): Promise<Array<Streamer>> {
        const fetchStreamers = await this.streamerRepository.getStreamers();
        const oldStreamerIds = fetchStreamers.map(streamer => streamer.id);
        const oldStreamers = await storeFolloweres(oldStreamerIds, this.twitchStreamerApi);
        return oldStreamers;
    }
    async getJpLiveStreaming(): Promise<Array<Stream>> {
        const streams = await this.twitchStreamerApi.getJpStreams();
        return streams;
    }
    filterStreams(streams: Array<Stream>, oldStreamerIds: Array<string>): Array<string> {
        const removeTag = [`ASMR`, `Commissions`];
        const removeId = [`126482446`, `9504944`];
        const newStreamerIds = streams
            .filter(stream => {
                if (stream.viewer_count == undefined || stream.user_id == undefined) {
                    return false;
                }
                //remove by tag or id
                if (stream.tags?.some(tag => removeTag.includes(tag))) {
                    return false;
                }
                if (removeId.includes(stream.user_id)) {
                    return false;
                }
                //remove less than 200 views live
                if (stream.viewer_count! < 200) {
                    return false;
                }
                //remove aleady exist ids
                if (oldStreamerIds.includes(stream.user_id!)) {
                    return false;
                }
                return true;
            })
            .map(e => e.user_id!);
        return newStreamerIds;
    }
    async getNewStreamerFollower(newStreamerIds: Array<string>): Promise<Array<Streamer>> {
        const newStreamers = await storeFolloweres(newStreamerIds, this.twitchStreamerApi);
        return newStreamers;
    }
    concatAndFilter(oldStreamers: Array<Streamer>, newStreamers: Array<Streamer>) {
        //Select streamers with top 200 followers
        const sumStreamers = sortByFollowerNum(oldStreamers.concat(newStreamers));
        const selectedStreamers = sumStreamers.slice(0, 200);
        const selectedStreamerIds = selectedStreamers.map(e => e.id);
        const newStreamerIds = newStreamers.map(e => e.id);
        const removedStreamerIds = sumStreamers
            .slice(200)
            .map(e => e.id)
            .filter(id => newStreamerIds.indexOf(id) == -1);
        const addedStreamerIds = selectedStreamerIds
            .filter(id => newStreamerIds.indexOf(id) != -1);
        return { selectedStreamers, removedStreamerIds, addedStreamerIds };
    }
    async updateStreamerInfo(
        selectedStreamers: Array<Streamer>
    ): Promise<Array<Streamer>> {
        const selectedStreamerIds = selectedStreamers.map(e => e.id);
        //push to firestore
        const storedStreamers = await this.twitchStreamerApi
            .getStreamers(selectedStreamerIds);
        //Re-enter the number of followers
        for (const key in storedStreamers) {
            const streamerInFollowerNum = selectedStreamers
                .find(e => e.id == storedStreamers[key].id);
            storedStreamers[key].follower_num = streamerInFollowerNum?.follower_num;
        }
        return storedStreamers;
    }
    async updateFirestore(
        storedStreamers: Array<Streamer>,
        removedStreamerIds: Array<string>,
        addedStreamerIds: Array<string>
    ) {

        await this.streamerRepository.updateStreamers(sortByFollowerNum(storedStreamers));
        for (const key in removedStreamerIds) {
            await this.clipRepository.deleteClipDoc(removedStreamerIds[key]);
        }
        for (const key in addedStreamerIds) {
            await this.clipRepository.createClipDoc(addedStreamerIds[key]);
        }
    }
}

async function storeFolloweres(ids: Array<string>, twitchStreamerApi: TwitchStreamerApi): Promise<Array<Streamer>> {
    const streamers: Array<Streamer> = [];

    for (const key in ids) {
        const id = ids[key];
        //get follower num from twitch api
        const followerNum = await twitchStreamerApi
            .getFollowerNum(id);
        streamers.push(new Streamer({
            id: id,
            follower_num: followerNum,
        }))
    }

    return streamers;
}

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
