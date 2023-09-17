import { Streamer } from '../../../models/streamer';
import { ClipFunction } from '../clipFunction';

export class GetYearRankingFunctionLogic extends ClipFunction{
    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi();
        return new GetYearRankingFunctionLogic(twitchClipApi);
    }

    async getClipForEeachStreamers(streamers: Array<Streamer>) {
    }
}