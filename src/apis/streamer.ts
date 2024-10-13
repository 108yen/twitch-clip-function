import assert from "assert"
import axios, { AxiosRequestConfig } from "axios"

import { Stream } from "../models/stream"
import { Streamer } from "../models/streamer"
import { Token } from "../models/token"
import { TwitchApi } from "./twitchApi"

export class TwitchStreamerApi extends TwitchApi {
    constructor(props: { client_id: string; token: Token }) {
        super(props)
    }

    public static async init(client_id: string, client_secret: string) {
        return new TwitchStreamerApi({
            client_id: client_id,
            token: await this.getToken(client_id, client_secret)
        })
    }

    private async getLeesThanOrEqualFiftyStreamers(props: {
        ids: Array<string>
    }): Promise<Array<Streamer>> {
        const config: AxiosRequestConfig = {
            headers: {
                [`Client-Id`]: this.client_id,
                Authorization: `Bearer ${this.token.access_token}`
            },
            method: `GET`,
            params: {
                id: props.ids
            },
            paramsSerializer: { indexes: null },
            url: `https://api.twitch.tv/helix/users`
        }

        const res = await axios<{ data: Array<Streamer> }>(config).catch(
            (error) => {
                console.error(
                    `TwitchStreamerApi/getLeesThanOrEqualFiftyStreamers/axios: ${error}`
                )
                throw new Error(error)
            }
        )
        const streamer = res?.data.data
        assert(
            typeof streamer !== `undefined`,
            new Error(
                `TwitchStreamerApi/getLeesThanOrEqualFiftyStreamers: streamer is undefined`
            )
        )

        return streamer
    }

    async getFollowerNum(id: string): Promise<number> {
        const config: AxiosRequestConfig = {
            headers: {
                [`Client-Id`]: this.client_id,
                Authorization: `Bearer ${this.token.access_token}`
            },
            method: `GET`,
            params: {
                broadcaster_id: id,
                first: 1
            },
            url: `https://api.twitch.tv/helix/channels/followers`
        }
        const res = await axios<{ total: number }>(config).catch((error) => {
            console.error(
                `TwitchStreamerApi/getFollowerNum/axios: ${error}`
            )
            throw new Error(error)
        })
        const followerNum = res?.data.total
        assert(
            typeof followerNum === `number`,
            new Error(
                `TwitchStreamerApi/getFollowerNum: followerNum is not number`
            )
        )

        return followerNum
    }

    async getJpStreams(): Promise<Array<Stream>> {
        const config: AxiosRequestConfig = {
            headers: {
                [`Client-Id`]: this.client_id,
                Authorization: `Bearer ${this.token.access_token}`
            },
            method: `GET`,
            params: {
                first: 100,
                language: `ja`
            },
            paramsSerializer: { indexes: null },
            url: `https://api.twitch.tv/helix/streams`
        }
        const res = await axios<{ data: Array<Stream> }>(config).catch(
            (error) => {
                console.error(
                    `TwitchStreamerApi/getJpStreams/axios: ${error}`
                )
                throw new Error(error)
            }
        )
        const streams = res?.data.data
        assert(
            typeof streams !== `undefined`,
            new Error(`TwitchStreamerApi/getJpStreams: streams is undefined`)
        )

        return streams
    }

    async getStreamers(ids: Array<string>): Promise<Array<Streamer>> {
        const chunkSize = 100
        const numChunks = Math.ceil(ids.length / chunkSize)
        let streamers: Array<Streamer> = []

        for (let i = 0; i < numChunks; i++) {
            streamers = streamers.concat(
                await this.getLeesThanOrEqualFiftyStreamers({
                    ids: ids.slice(i * chunkSize, (i + 1) * chunkSize)
                })
            )
        }
        return streamers
    }
}
