import { TwitchClipApi } from '../../../src/apis/clip';
import { Streamer } from '../../../src/models/streamer';
import { BatchRepository } from '../../../src/repositories/batch';
import { ClipRepository } from '../../../src/repositories/clip';
import { StreamerRepository } from '../../../src/repositories/streamer';

export abstract class ClipFunction{
    protected streamerRepository = new StreamerRepository();
    protected clipRepository = new ClipRepository();
    protected batchRepository = new BatchRepository(10);
    protected twitchClipApi: TwitchClipApi;
    constructor(twitchClipApi: TwitchClipApi) {
        this.twitchClipApi = twitchClipApi;
    }
    protected static async getTwitchClipApi() {
        const twitchClipApi = await TwitchClipApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        return twitchClipApi;
    }

    async getStreamers(): Promise<Array<Streamer>> {
        return await this.streamerRepository.getStreamers();
    }

    abstract getClipForEeachStreamers(streamers: Array<Streamer>):Promise<void>;
}