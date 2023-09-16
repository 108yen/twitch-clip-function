import axios, { AxiosRequestConfig } from "axios";
import { Token } from "../models/token";
import { TwitchApi } from "./twitchApi";
import * as functions from "firebase-functions";
import { Streamer } from "../models/streamer";
import { Stream } from "../models/stream";

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

    async getJpStreams(): Promise<Array<Stream>> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/streams`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${this.token.access_token}`,
                [`Client-Id`]: this.client_id,
            },
            params: {
                language: `ja`,
                first: 100,
            },
            paramsSerializer: { indexes: null }
        }
        const res = await axios(config)
            .catch((error) => {
                functions.logger.error(`TwitchStreamerApi/getJpStreams/axios: ${error}`);
                throw new Error(error);
            });
        return res?.data.data;
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
                functions.logger.error(`TwitchStreamerApi/getFollowerNum/axios: ${error}`);
                throw new Error(error);
            });
        return res?.data.total;
    }


    async getStreamers(
        ids: Array<string>,
    ): Promise<Array<Streamer>> {
        const chunkSize = 100;
        const numChunks = Math.ceil(ids.length / chunkSize);
        let streamers: Array<Streamer> = [];

        for (let i = 0; i < numChunks; i++) {
            streamers = streamers.concat(
                await this.getLeesThanOrEqualFiftyStreamers({
                    ids: ids.slice(i * chunkSize, (i + 1) * chunkSize),
                })
            );
        }
        return streamers;
    }

    private async getLeesThanOrEqualFiftyStreamers(props: {
        ids: Array<string>,
    }): Promise<Array<Streamer>> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/users`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${this.token.access_token}`,
                [`Client-Id`]: this.client_id,
            },
            params: {
                id: props.ids,
            },
            paramsSerializer: { indexes: null }
        }

        const res = await axios(config)
            .catch((error) => {
                functions.logger.error(`TwitchStreamerApi/getLeesThanOrEqualFiftyStreamers/axios:: ${error}`);
                throw new Error(error);                
            });

        return res?.data.data;
    }
}