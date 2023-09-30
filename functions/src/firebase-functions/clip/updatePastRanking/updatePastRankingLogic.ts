import assert from "assert"

import * as functions from "firebase-functions"

import { ClipDoc } from "../../../models/clipDoc"
import { Streamer } from "../../../models/streamer"
import { ClipFunction } from "../clipFunction"

export class UpdatePastRankingLogic extends ClipFunction {
    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi()
        return new UpdatePastRankingLogic(twitchClipApi, `past_summary`)
    }

    //todo:リファクタリング（updateEachPeriodsRankingと合わせる）
    async getClipDoc(streamer: Streamer): Promise<ClipDoc | undefined> {
        assert(
            typeof streamer.created_at === `string`,
            new Error(
                `GetYearRankingFunctionLogic/getClipDoc: ${streamer.display_name}: created_at is not string`
            )
        )
        const created_at = new Date(streamer.created_at)
        //at least, from 2016
        const start_year =
            created_at.getFullYear() < 2016 ? 2016 : created_at.getFullYear()
        const current_year = new Date().getFullYear()
        //if channel created current year
        if (start_year == current_year) {
            functions.logger.info(
                `${streamer.display_name}: account created at this year`
            )
            return
        }
        //get foreach year clip ranking
        const clipDoc = new ClipDoc()
        for (let year = start_year; year < current_year; year++) {
            const started_at = new Date(year, 0, 1, 0, 0, 0)
            const ended_at = new Date(year, 11, 31, 23, 59, 59)
            const clips = await this.getClips(
                { started_at: started_at, ended_at: ended_at },
                streamer.id
            )
            //if exist
            if (clips.length != 0) {
                const addStreamerinfoClip = this.addStreamerinfoToClips(clips, streamer)
                clipDoc.clipsMap.set(year.toString(), addStreamerinfoClip)
            }
        }
        if (clipDoc.clipsMap.size == 0) {
            functions.logger.info(`${streamer.display_name}: has no past clips`)
            return
        }

        return clipDoc
    }
}
