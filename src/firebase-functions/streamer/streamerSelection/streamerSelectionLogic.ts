
import { BatchRepository } from "../../..//repositories/batch"
import { TwitchStreamerApi } from "../../../apis/streamer"
import { ClipDoc } from "../../../models/clipDoc"
import { Stream } from "../../../models/stream"
import { Streamer } from "../../../models/streamer"
import { ClipRepository } from "../../../repositories/clip"
import { StreamerRepository } from "../../../repositories/streamer"

export class StreamerSelectionLogic {
    private batchRepository = new BatchRepository()
    private clipRepository = new ClipRepository()
    private streamerRepository = new StreamerRepository()
    private twitchStreamerApi: TwitchStreamerApi
    STREAMER_NUM_LIMIT = 300
    constructor(twitchStreamerApi: TwitchStreamerApi) {
        this.twitchStreamerApi = twitchStreamerApi
    }

    public static async init() {
        const twitchStreamerApi = await TwitchStreamerApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        )
        return new StreamerSelectionLogic(twitchStreamerApi)
    }

    private sortByFollowerNum(streamers: Array<Streamer>) {
        return streamers.sort((a, b) => {
            if (b.follower_num == undefined) {
                return -1
            }
            if (a.follower_num == undefined) {
                return 1
            }
            return b.follower_num - a.follower_num
        })
    }

    private async storeFollowers(
        ids: Array<string>,
        twitchStreamerApi: TwitchStreamerApi
    ): Promise<Array<Streamer>> {
        const streamers: Array<Streamer> = []

        for (const key in ids) {
            const id = ids[key]
            //get follower num from twitch api
            const followerNum = await twitchStreamerApi.getFollowerNum(id)
            streamers.push(
                new Streamer({
                    follower_num: followerNum,
                    id: id
                })
            )
        }

        return streamers
    }
    concatAndFilter(oldStreamers: Array<Streamer>, newStreamers: Array<Streamer>) {
        //Select streamers with top STREAMER_NUM_LIMIT
        const sumStreamers = this.sortByFollowerNum(oldStreamers.concat(newStreamers))
        const selectedStreamers = sumStreamers.slice(0, this.STREAMER_NUM_LIMIT)
        const selectedStreamerIds = selectedStreamers.map((e) => e.id)
        const newStreamerIds = newStreamers.map((e) => e.id)
        const removedStreamerIds = sumStreamers
            .slice(this.STREAMER_NUM_LIMIT)
            .map((e) => e.id)
            .filter((id) => newStreamerIds.indexOf(id) == -1)
        const addedStreamerIds = selectedStreamerIds.filter(
            (id) => newStreamerIds.indexOf(id) != -1
        )
        return { addedStreamerIds, removedStreamerIds, selectedStreamers }
    }
    filterStreams(streams: Array<Stream>, oldStreamerIds: Array<string>): Array<string> {
        const removeTag = [`ASMR`, `Commissions`]
        const removeId = [
            `496970086`, //
            `126482446`,
            `9504944`,
            `840446934`,
            `208760543`,
            `134850221`, //RTAinJapan
            `182565961`, //World of Warships
            `179988448`, //PUBG JAPAN
            `144740532`, //japanese_stream
            `229395457`, //east geeks mash
            `79294007` //mira
        ]
        const filteredId = streams
            .filter((stream) => {
                const viewer_count = stream.viewer_count
                const user_id = stream.user_id
                if (viewer_count == undefined || user_id == undefined) {
                    return false
                }
                //remove by tag or id
                if (stream.tags?.some((tag) => removeTag.includes(tag))) {
                    return false
                }
                if (removeId.includes(user_id)) {
                    return false
                }
                //remove less than 500 views live
                if (viewer_count < 500) {
                    return false
                }
                //remove already exist ids
                if (oldStreamerIds.includes(user_id)) {
                    return false
                }
                return true
            })
            .map((e) => e.user_id) as Array<string>
        //remove duplicate
        const newStreamerIds: Array<string> = filteredId.filter(
            (id, index) => filteredId.indexOf(id) === index
        )
        return newStreamerIds
    }
    async getJpLiveStreaming(): Promise<Array<Stream>> {
        const streams = await this.twitchStreamerApi.getJpStreams()
        return streams
    }
    async getNewStreamerFollower(
        newStreamerIds: Array<string>
    ): Promise<Array<Streamer>> {
        const newStreamers = await this.storeFollowers(
            newStreamerIds,
            this.twitchStreamerApi
        )
        return newStreamers
    }
    async getOldStreamer(): Promise<{
        oldStreamerIds: Array<string>
        oldStreamers: Array<Streamer>
    }> {
        const fetchStreamers = await this.streamerRepository.getStreamers()
        const oldStreamerIds = fetchStreamers.map((streamer) => streamer.id)
        const oldStreamers = await this.storeFollowers(
            oldStreamerIds,
            this.twitchStreamerApi
        )
        return { oldStreamerIds, oldStreamers }
    }
    async updateFirestore(
        storedStreamers: Array<Streamer>,
        removedStreamerIds: Array<string>
    ) {
        this.streamerRepository.batchUpdateStreamers(
            storedStreamers,
            await this.batchRepository.getBatch()
        )
        for (const streamer of storedStreamers) {
            this.clipRepository.batchUpdateClip(
                streamer.id,
                new ClipDoc({ streamerInfo: streamer }),
                await this.batchRepository.getBatch()
            )
        }
        for (const key in removedStreamerIds) {
            this.clipRepository.batchDeleteClipDoc(
                removedStreamerIds[key],
                await this.batchRepository.getBatch()
            )
        }
        await this.batchRepository.commitBatch()
    }
    async updateStreamerInfo(
        selectedStreamers: Array<Streamer>
    ): Promise<{ banedIds: Array<string>; storedStreamers: Array<Streamer> }> {
        const selectedStreamerIds = selectedStreamers.map((e) => e.id)
        //push to firestore
        const storedStreamers =
            await this.twitchStreamerApi.getStreamers(selectedStreamerIds)
        //Re-enter the number of followers
        for (const key in storedStreamers) {
            const streamerInFollowerNum = selectedStreamers.find(
                (e) => e.id == storedStreamers[key].id
            )
            storedStreamers[key].follower_num = streamerInFollowerNum?.follower_num
        }
        const sortedStreamers = this.sortByFollowerNum(storedStreamers)

        //if baned streamer exist
        const banedIds = selectedStreamerIds.filter((id) =>
            sortedStreamers.every((streamer) => streamer.id !== id)
        )

        return { banedIds, storedStreamers: sortedStreamers }
    }
}
