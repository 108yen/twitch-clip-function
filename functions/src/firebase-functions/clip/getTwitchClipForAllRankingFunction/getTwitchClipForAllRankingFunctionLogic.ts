import { Streamer } from "../../../models/streamer";
import { ClipFunction } from "../clipFunction";

export class GetTwitchClipForAllRankingFunctionLogic extends ClipFunction {
    
    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi();
        return new GetTwitchClipForAllRankingFunctionLogic(twitchClipApi);
    }


    getClipForEeachStreamers(streamers: Streamer[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}