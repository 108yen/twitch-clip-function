import axios, { AxiosRequestConfig } from "axios";
import * as functions from "firebase-functions";
import { Clip } from "../models/clip";
import { ClipDoc } from "../models/clipDoc";
import { Token } from "../models/token";

export class ClipRepository {
    CLIP_NUM = 100;

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
        let clipsList: { [key: string]: Array<Clip> } = {};
        for (const key in dayList) {
            //get twitch clips from twitch api
            const clips: Array<Clip> = await this.getClips(
                parseInt(id),
                client_id,
                token,
                dayList[key],
            )
            clipsList[key] = clips;
        }
        //return this
        const result = new ClipDoc({
            day: clipsList['day'],
            week: clipsList['week'],
            month: clipsList['month'],
            year: clipsList['year'],
        })
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

}