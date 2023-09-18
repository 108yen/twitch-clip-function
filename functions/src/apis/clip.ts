import assert from "assert"

import axios, { AxiosRequestConfig } from "axios"
import * as functions from "firebase-functions"

import { Clip } from "../models/clip"
import { Token } from "../models/token"

import { TwitchApi } from "./twitchApi"

export class TwitchClipApi extends TwitchApi {
    private CLIP_NUM = 100

    constructor(props: { token: Token; client_id: string }) {
        super(props)
    }

    public static async init(client_id: string, client_secret: string) {
        return new TwitchClipApi({
            token: await this.getToken(client_id, client_secret),
            client_id: client_id
        })
    }

    async getClips(
        broadcaster_id: number,
        started_at?: Date,
        ended_at?: Date
    ): Promise<Array<Clip>> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/clips`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${this.token.access_token}`,
                [`Client-Id`]: this.client_id
            },
            params: {
                broadcaster_id: broadcaster_id,
                first: this.CLIP_NUM
            }
        }

        if (started_at && ended_at) {
            config.params.started_at = started_at.toISOString()
            config.params.ended_at = ended_at.toISOString()
        }
        const res = await axios<{ data: Array<Clip> }>(config).catch((error) => {
            functions.logger.error(`TwitchClipApi/getClips/axios: ${error}`)
            throw new Error(error)
        })
        const clips = res?.data.data
        assert(
            typeof clips !== `undefined`,
            new Error(
                `TwitchClipApi/getClips: clipId:${broadcaster_id}, clips is undefined`
            )
        )

        return clips
    }
}
