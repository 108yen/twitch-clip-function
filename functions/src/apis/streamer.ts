import axios, { AxiosRequestConfig } from "axios";
import { Token } from "../models/token";
import { TwitchApi } from "./twitchApi";
import * as functions from "firebase-functions";
import { Streamer } from "../models/streamer";

export class TwitchStreamerApi extends TwitchApi {

    constructor(props: { token: Token, client_id: string }) {
        super(props);
    }

    public static async init(client_id: string, client_secret: string) {
        return new TwitchStreamerApi({
            token: await this.getToken(client_id, client_secret),
            client_id: client_id,
        });
    }

    async getFollowerNum(
        id: string,
    ): Promise<number> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/channels/followers`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${this.token.access_token}`,
                [`Client-Id`]: this.client_id,
            },
            params: {
                broadcaster_id: id,
                first: 1,
            }
        }
        const res = await axios(config)
            .catch((error) => {
                functions.logger.error(`twitch apiからフォロワー数の取得に失敗しました: ${error}`);
            });
        return res?.data.total;
    }


    async getStreamers(
        ids: Array<string>,
        isId: boolean,
    ): Promise<Array<Streamer>> {
        const chunkSize = 100;
        const numChunks = Math.ceil(ids.length / chunkSize);
        let streamers: Array<Streamer> = [];

        if (isId) {
            for (let i = 0; i < numChunks; i++) {
                streamers = streamers.concat(
                    await this.getLeesThanOrEqualFiftyStreamers({
                        logins: null,
                        ids: ids.slice(i * chunkSize, (i + 1) * chunkSize),
                    })
                );
            }
        } else {
            for (let i = 0; i < numChunks; i++) {
                streamers = streamers.concat(
                    await this.getLeesThanOrEqualFiftyStreamers({
                        logins: ids.slice(i * chunkSize, (i + 1) * chunkSize),
                        ids: null,
                    })
                );
            }
        }
        return streamers;
    }

    private async getLeesThanOrEqualFiftyStreamers(props: {
        logins: Array<string>,
        ids: null,
    } | {
        logins: null,
        ids: Array<string>,
    }): Promise<Array<Streamer>> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/users`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${this.token.access_token}`,
                [`Client-Id`]: this.client_id,
            },
            paramsSerializer: { indexes: null }
        }
        if (props.logins != null) {
            config.params = {
                login: props.logins
            }
        } else if (props.ids != null) {
            config.params = {
                id: props.ids
            }
        }
        const res = await axios(config)
            .catch((error) => {
                functions.logger.error(`twitch apiからストリーマー情報の取得に失敗しました: ${error}`);
            });

        return res?.data.data;
    }
}