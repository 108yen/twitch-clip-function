import assert from "assert"

import axios, { AxiosRequestConfig } from "axios"
import * as functions from "firebase-functions"

import { Stream } from "../models/stream"
import { Streamer } from "../models/streamer"
import { Token } from "../models/token"

import { TwitchApi } from "./twitchApi"

export class TwitchStreamerApi extends TwitchApi {
    constructor(props: { token: Token; client_id: string }) {
        super(props)
    }

    public static async init(client_id: string, client_secret: string) {
        return new TwitchStreamerApi({
            token: await this.getToken(client_id, client_secret),
            client_id: client_id
        })
    }

    async getJpStreams(): Promise<Array<Stream>> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/streams`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${this.token.access_token}`,
                [`Client-Id`]: this.client_id
            },
            params: {
                language: `ja`,
                first: 100
            },
            paramsSerializer: { indexes: null }
        }
        const res = await axios<{ data: Array<Stream> }>(config).catch(
            (error) => {
                functions.logger.error(
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

    async getFollowerNum(id: string): Promise<number> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/channels/followers`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${this.token.access_token}`,
                [`Client-Id`]: this.client_id
            },
            params: {
                broadcaster_id: id,
                first: 1
            }
        }
        const res = await axios<{ total: number }>(config).catch((error) => {
            functions.logger.error(
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

    private async getLeesThanOrEqualFiftyStreamers(props: {
        ids: Array<string>
    }): Promise<Array<Streamer>> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/users`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${this.token.access_token}`,
                [`Client-Id`]: this.client_id
            },
            params: {
                id: props.ids
            },
            paramsSerializer: { indexes: null }
        }

        const res = await axios<{ data: Array<Streamer> }>(config).catch(
            (error) => {
                functions.logger.error(
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
}
