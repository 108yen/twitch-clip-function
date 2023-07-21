import axios, { AxiosRequestConfig } from "axios";
import * as functions from "firebase-functions";
import { Clip } from "../models/clip";
import { ClipDoc } from "../models/clipDoc";
import { Token } from "../models/token";
import { clipDocRef } from "../firestore-refs/clipRefs";
import { Streamer } from "../models/streamer";

export class ClipRepository {
    CLIP_NUM = 100;

    async fetchClip(clipId: string): Promise<ClipDoc> {
        const ds = await clipDocRef({ clipId: clipId }).get();
        if (!ds.data()) {
            throw new Error(`documentId: ${clipId}のclipの取得に失敗しました。`);
        }

        return ds.data()!;
    }

    //for each streamer, get day,week,month period clip
    async getEachPeriodClips(
        id: string,
        client_id: string,
        token: Token,
    ): Promise<ClipDoc> {
        //loop each period
        const dayList: { [key: string]: number } = {
            day: 1,
            week: 7,
            month: 30,
            year: 365,
        };
        const result = new ClipDoc();
        for (const key in dayList) {
            //get twitch clips from twitch api
            const clips: Array<Clip> = await this.getClips(
                parseInt(id),
                client_id,
                token,
                dayList[key],
            )
            result.clipsMap.set(
                key,
                clips
            );
        }
        return result;
    }


    private async getClips(
        broadcaster_id: number,
        client_id: string,
        token: Token,
        days: number
    ): Promise<Array<Clip>> {
        let config: AxiosRequestConfig;
        //if period is all
        if (days == -1) {
            config = {
                url: 'https://api.twitch.tv/helix/clips',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token.access_token,
                    'Client-Id': client_id,
                },
                params: {
                    'broadcaster_id': broadcaster_id,
                    'first': this.CLIP_NUM,
                }
            }
            //else period
        } else {
            const now = new Date(); // get present date
            const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000); //days ago

            config = {
                url: 'https://api.twitch.tv/helix/clips',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token.access_token,
                    'Client-Id': client_id,
                },
                params: {
                    'broadcaster_id': broadcaster_id,
                    'first': this.CLIP_NUM,
                    'started_at': daysAgo.toISOString(),
                    'ended_at': now.toISOString(),
                }
            }
        }
        const res = await axios(config)
            .catch((error) => {
                functions.logger.error(`twitch apiからクリップの取得に失敗しました: ${error}`);
            });
        return res?.data.data;
    }

    async getYearRankingForEachStreamer(
        streamer: Streamer,
        client_id: string,
        token: Token,
    ): Promise<ClipDoc | undefined> {
        let result = new ClipDoc();

        //if undefined
        if (!streamer.created_at) {
            functions.logger.error(`${streamer.display_name}: created_at is undefined`);
            return undefined;
        }
        //get start year
        const created_at = new Date(streamer.created_at);
        //at least, from 2016
        const start_year = created_at.getFullYear() < 2016 ? 2016 : created_at.getFullYear();
        const current_year = new Date().getFullYear();
        //if created current year
        if (start_year == current_year) {
            functions.logger.error(`${streamer.display_name}: account created_at this year`);
            return undefined;
        }
        //get foreach year clip ranking
        for (let year = start_year; year < current_year; year++) {
            const clips = await this.getClipsYear(
                parseInt(streamer.id),
                year,
                client_id,
                token
            );
            //if exist
            if (clips.length != 0) {
                result.clipsMap.set(
                    year.toString(),
                    clips,
                );
            }
        }
        //if exist result
        if (result.clipsMap.size != 0) {
            return result;
        }

        functions.logger.error(`${streamer.display_name}: has no past clips`);
        return undefined;
    }

    async getClipsYear(
        broadcaster_id: number,
        year: number,
        client_id: string,
        token: Token,
    ): Promise<Array<Clip>> {
        const started_at = new Date(year, 0, 1, 0, 0);
        const ended_at = new Date(year, 11, 31, 23, 59);

        const config: AxiosRequestConfig = {
            url: 'https://api.twitch.tv/helix/clips',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token.access_token,
                'Client-Id': client_id,
            },
            params: {
                'broadcaster_id': broadcaster_id,
                'first': this.CLIP_NUM,
                'started_at': started_at.toISOString(),
                'ended_at': ended_at.toISOString(),
            }
        }
        const res = await axios(config)
            .catch((error) => {
                functions.logger.error(`twitch apiからクリップの取得に失敗しました: ${error}`);
            });
        
        return res?.data.data;
    }

}