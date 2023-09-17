import { Streamer } from "../../../models/streamer";
import { ClipFunction } from "../clipFunction";
import { ClipDoc } from "../../../models/clipDoc";
import { Clip } from "../../../models/clip";

export class GetTwitchClipForAllRankingFunctionLogic extends ClipFunction {

    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi();
        return new GetTwitchClipForAllRankingFunctionLogic(twitchClipApi);
    }

    async getClipForEeachStreamers(streamers: Array<Streamer>): Promise<void> {
        //for summary ranking
        const summary = new ClipDoc();
        //get for each streamer's clips
        for (const key in streamers) {
            const streamer = streamers[key];
            const clipDoc = await this.getClipDoc(streamer.id);
            clipDoc.sort();

            //push to firestore
            this.clipRepository.batchUpdateClip(
                streamer.id,
                clipDoc,
                await this.batchRepository.getBatch()
            );
            summary.clipDocConcat(clipDoc);
        }
        summary.sort();

        //push to firestore
        this.clipRepository.batchUpdateClip(
            `summary`,
            summary,
            await this.batchRepository.getBatch()
        );
        await this.batchRepository.commitBatch();
    }

    private async getClipDoc(streamerId: string): Promise<ClipDoc> {
        const clipDoc = new ClipDoc();
        const clips = await this.getClips(streamerId);
        clipDoc.clipsMap.set(
            `all`,
            clips,
        );

        return clipDoc;
    }

    private async getClips(streamerId: string): Promise<Array<Clip>> {
        const clips = await this.twitchClipApi.getClips(
            parseInt(streamerId),
        );
        return clips;
    }
}