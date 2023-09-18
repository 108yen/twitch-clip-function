import assert from "assert"

import * as functions from "firebase-functions"

import { Clip } from "../../../models/clip"
import { ClipDoc } from "../../../models/clipDoc"
import { Streamer } from "../../../models/streamer"
import { ClipFunction } from "../clipFunction"

export class GetYearRankingFunctionLogic extends ClipFunction {
    public static async init() {
        const twitchClipApi = await this.getTwitchClipApi()
        return new GetYearRankingFunctionLogic(twitchClipApi)
    }

    async getClipForEeachStreamers(streamers: Array<Streamer>) {
        //for summary ranking
        const summary = new ClipDoc()
        //get for each streamer's clips
        for (const key in streamers) {
            const streamer = streamers[key]
            const clipDoc = await this.getClipDoc(streamer)
            if (clipDoc) {
                clipDoc.sort()
                this.clipRepository.batchUpdateClip(
                    streamer.id,
                    clipDoc,
                    await this.batchRepository.getBatch()
                )

                summary.clipDocConcat(clipDoc)
                summary.sort()
            }
        }
        //post summary clips to firestore
        this.clipRepository.batchUpdateClip(
            `past_summary`,
            summary,
            await this.batchRepository.getBatch()
        )
        await this.batchRepository.commitBatch()
    }

    private async getClipDoc(streamer: Streamer): Promise<ClipDoc | undefined> {
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
            const clips = await this.getClips(year, streamer.id)
            //if exist
            if (clips.length != 0) {
                clipDoc.clipsMap.set(year.toString(), clips)
            }
        }
        if (clipDoc.clipsMap.size == 0) {
            functions.logger.info(`${streamer.display_name}: has no past clips`)
            return
        }

        return clipDoc
    }

    private async getClips(year: number, streamerId: string): Promise<Array<Clip>> {
        const started_at = new Date(year, 0, 1, 0, 0, 0)
        const ended_at = new Date(year, 11, 31, 23, 59, 59)
        const clips = await this.twitchClipApi.getClips(
            parseInt(streamerId),
            started_at,
            ended_at
        )
        return clips
    }
}
