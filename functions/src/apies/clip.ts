import axios, { AxiosRequestConfig } from "axios";
import * as functions from "firebase-functions";
import { Clip } from "../models/clip";
import { TwitchApi } from "./twitchApi";

export class TwitchClipApi extends TwitchApi {
    private CLIP_NUM = 100;

    async getClips(
        broadcaster_id: number,
        client_id: string,
        started_at?: Date,
        ended_at?: Date,
    ): Promise<Array<Clip>> {
        let config: AxiosRequestConfig;

        if (started_at && ended_at) {
            config = {
                url: `https://api.twitch.tv/helix/clips`,
                method: `GET`,
                headers: {
                    Authorization: `Bearer ${this.token.access_token}`,
                    [`Client-Id`]: client_id,
                },
                params: {
                    broadcaster_id: broadcaster_id,
                    first: this.CLIP_NUM,
                    started_at: started_at.toISOString(),
                    ended_at: ended_at.toISOString(),
                }
            }
        } else {
            config = {
                url: `https://api.twitch.tv/helix/clips`,
                method: `GET`,
                headers: {
                    Authorization: `Bearer ${this.token.access_token}`,
                    [`Client-Id`]: client_id,
                },
                params: {
                    broadcaster_id: broadcaster_id,
                    first: this.CLIP_NUM,
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