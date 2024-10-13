import assert from "assert"
import axios, { AxiosRequestConfig } from "axios"

import { Clip } from "../models/clip"
import { Token } from "../models/token"
import dayjs from "../utils/dayjs"
import { TwitchApi } from "./twitchApi"

export class TwitchClipApi extends TwitchApi {
    private CLIP_NUM = 100

    constructor(props: { client_id: string; token: Token }) {
        super(props)
    }

    public static async init(client_id: string, client_secret: string) {
        return new TwitchClipApi({
            client_id: client_id,
            token: await this.getToken(client_id, client_secret)
        })
    }

    async getClips(
        broadcaster_id: number,
        started_at?: dayjs.Dayjs,
        ended_at?: dayjs.Dayjs
    ): Promise<Array<Clip>> {
        const config: AxiosRequestConfig = {
            headers: {
                [`Client-Id`]: this.client_id,
                Authorization: `Bearer ${this.token.access_token}`
            },
            method: `GET`,
            params: {
                broadcaster_id: broadcaster_id,
                first: this.CLIP_NUM
            },
            url: `https://api.twitch.tv/helix/clips`
        }

        if (started_at && ended_at) {
            config.params.started_at = started_at.toISOString()
            config.params.ended_at = ended_at.toISOString()
        }
        const res = await axios<{ data: Array<Clip> }>(config).catch((error) => {
            console.error(`TwitchClipApi/getClips/axios: ${error}`)
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
