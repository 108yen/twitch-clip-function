import { StreamerRepository } from "../../../repositories/streamer";
import { TwitchStreamerApi } from "../../../apis/streamer";
import { Streamer } from "../../../models/streamer";
import { Stream } from "../../../models/stream";
import { ClipRepository } from "../../../repositories/clip";
import { BatchRepository } from "../../..//repositories/batch";

export class StreamerSelectionLogic {
    private streamerRepository = new StreamerRepository();
    private clipRepository = new ClipRepository();
    private batchRepository = new BatchRepository();
    private twitchStreamerApi: TwitchStreamerApi;
    constructor(twitchStreamerApi: TwitchStreamerApi) {
        this.twitchStreamerApi = twitchStreamerApi;
    }

    public static async init() {
        const twitchStreamerApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        return new StreamerSelectionLogic(twitchStreamerApi);
    }

    async getOldStreamer(): Promise<{ oldStreamers: Array<Streamer>, oldStreamerIds: Array<string> }> {
        const fetchStreamers = await this.streamerRepository.getStreamers();
        const oldStreamerIds = fetchStreamers.map(streamer => streamer.id);
        const oldStreamers = await this.storeFolloweres(oldStreamerIds, this.twitchStreamerApi);
        return { oldStreamers, oldStreamerIds };
    }
    async getJpLiveStreaming(): Promise<Array<Stream>> {
        const streams = await this.twitchStreamerApi.getJpStreams();
        return streams;
    }
    filterStreams(streams: Array<Stream>, oldStreamerIds: Array<string>): Array<string> {
        const removeTag = [`ASMR`, `Commissions`];
        const removeId = [`126482446`, `9504944`, `840446934`, `208760543`];
        const filteredId = streams
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
        //remove duplicate
        const newStreamerIds = filteredId
            .filter((id, index) => filteredId.indexOf(id) === index);
        return newStreamerIds;
    }
    async getNewStreamerFollower(newStreamerIds: Array<string>): Promise<Array<Streamer>> {
        const newStreamers = await this.storeFolloweres(newStreamerIds, this.twitchStreamerApi);
        return newStreamers;
    }
    concatAndFilter(oldStreamers: Array<Streamer>, newStreamers: Array<Streamer>) {
        //Select streamers with top 200 followers
        const sumStreamers = this.sortByFollowerNum(oldStreamers.concat(newStreamers));
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
        return this.sortByFollowerNum(storedStreamers);
    }
    async updateFirestore(
        storedStreamers: Array<Streamer>,
        removedStreamerIds: Array<string>,
        addedStreamerIds: Array<string>
    ) {
        this.streamerRepository
            .batchUpdateStreamers(
                storedStreamers,
                await this.batchRepository.getBatch()
            );
        for (const key in removedStreamerIds) {
            this.clipRepository.batchDeleteClipDoc(
                removedStreamerIds[key],
                await this.batchRepository.getBatch()
            );
        }
        for (const key in addedStreamerIds) {
            this.clipRepository.batchCreateClipDoc(
                addedStreamerIds[key],
                await this.batchRepository.getBatch()
            );
        }
        await this.batchRepository.commitBatch();
    }
    private async storeFolloweres(ids: Array<string>, twitchStreamerApi: TwitchStreamerApi): Promise<Array<Streamer>> {
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
    private sortByFollowerNum(streamers: Array<Streamer>) {
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
}