import * as functions from "firebase-functions";
import { ClipDoc } from "../../../models/clipDoc";
import { Streamer } from '../../../models/streamer';
import { ClipFunction } from '../clipFunction';

export class GetYearRankingFunctionLogic extends ClipFunction{
    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi();
        return new GetYearRankingFunctionLogic(twitchClipApi);
    }

    async getClipForEeachStreamers(streamers: Array<Streamer>) {
        //for summary ranking
        const summary = new ClipDoc();
        //get for each streamer's clips
        for (const key in streamers) {
            const streamer = streamers[key];
            const clipDoc = new ClipDoc();
            if (!streamer.created_at) {
                functions.logger.error(`${streamer.display_name}: created_at is undefined`);
                break;
            }
            const created_at = new Date(streamer.created_at);
            //at least, from 2016
            const start_year = created_at.getFullYear() < 2016 ? 2016 : created_at.getFullYear();
            const current_year = new Date().getFullYear();
            //if channel created current year
            if (start_year == current_year) {
                functions.logger.info(`${streamer.display_name}: account created_at this year`);
                break;
            }
            //get foreach year clip ranking
            for (let year = start_year; year < current_year; year++) {
                const started_at = new Date(year, 0, 1, 0, 0, 0);
                const ended_at = new Date(year, 11, 31, 23, 59, 59);
                const clips = await this.twitchClipApi.getClips(
                    parseInt(streamer.id),
                    started_at,
                    ended_at,
                )
                //if exist
                if (clips.length != 0) {
                    clipDoc.clipsMap.set(
                        year.toString(),
                        clips,
                    );
                }
            }
            //if exist result
            if (clipDoc.clipsMap.size != 0) {
                clipDoc.sort()
                //push to firestore
                await this.clipRepository.updateClip(streamers[key].id, clipDoc);
                //for each year, push to summary
                summary.clipDocConcat(clipDoc);
                summary.sort();
            } else {
                functions.logger.info(`${streamer.display_name}: has no past clips`);
            }
        }
        //post summary clips to firestore
        await this.clipRepository.updateClip(`past_summary`, summary);
    }
}