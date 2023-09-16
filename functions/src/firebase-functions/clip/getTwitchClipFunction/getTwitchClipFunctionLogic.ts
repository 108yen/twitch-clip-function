import { ClipDoc } from "../../../models/clipDoc";
import { ClipRepository } from "../../../repositories/clip";
import { StreamerRepository } from "../../../repositories/streamer";
import { TwitchClipApi } from "../../../apis/clip";
import { Clip } from "../../../models/clip";
import { Streamer } from "../../../models/streamer";

export class GetTwitchClipFunctionLogic {
    private streamerRepository = new StreamerRepository();
    private clipRepository = new ClipRepository();
    private twitchClipApi: TwitchClipApi;
    constructor(twitchClipApi: TwitchClipApi) {
        this.twitchClipApi = twitchClipApi;
    }

    public static async init() {
        const twitchClipApi = await TwitchClipApi.init(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        return new GetTwitchClipFunctionLogic(twitchClipApi);
    }

    async getStreamers():Promise<Array<Streamer>> {
        return await this.streamerRepository.getStreamers();
    }

    async getClipForEachStreamers(streamers: Array<Streamer>) {
        const summary = new ClipDoc();
        for (const key in streamers) {
            if (Object.prototype.hasOwnProperty.call(streamers, key)) {
                const streamer = streamers[key];
                const clipDoc = await this.getClipForEachPeriods(streamer.id);

                //push to firestore
                await this.clipRepository.updateClip(streamer.id, clipDoc);
                summary.clipDocConcat(clipDoc);
            }
        }
        summary.sort();
        //push to firestore
        await this.clipRepository.updateClip(`summary`, summary);
    }

    private async getClipForEachPeriods(streamerId: string):Promise<ClipDoc> {
        const periods: { [key: string]: number } = {
            day: 1,
            week: 7,
            month: 30,
            year: 365,
        };

        const clipDoc = new ClipDoc();
        for (const key in periods) {
            if (Object.prototype.hasOwnProperty.call(periods, key)) {
                const period = periods[key];
                const clips = await this.getClips(period, streamerId);
                clipDoc.clipsMap.set(
                    key,
                    clips,
                );
            }
        }
        
        return clipDoc;
    }

   private async getClips(period: number,streamerId:string):Promise<Array<Clip>> {
        const now = new Date(); // get present date
        const daysAgo = new Date(now.getTime() - period * 24 * 60 * 60 * 1000); //days ago
        const clips = await this.twitchClipApi.getClips(
            parseInt(streamerId),
            daysAgo,
            now,
        )
        return clips;
    }
    
}