import assert from "assert"
import axios, { AxiosRequestConfig } from "axios"

import { Token } from "../models/token"

export class TwitchApi {
    protected client_id!: string
    protected token!: Token

    constructor(props: { client_id: string; token: Token }) {
        Object.assign(this, props)
    }

    protected static async getToken(client_id: string, client_secret: string) {
        const config: AxiosRequestConfig = {
            headers: {
                [`Content-Type`]: `application/x-www-form-urlencoded`
            },
            method: `POST`,
            params: {
                client_id: client_id,
                client_secret: client_secret,
                grant_type: `client_credentials`
            },
            paramsSerializer: { indexes: null },
            url: `https://id.twitch.tv/oauth2/token`
        }

        const res = await axios<Token>(config).catch((error) => {
            console.error(`TwitchAPI/getToken/axios: ${error}`)
            throw new Error(error)
        })
        const token = res?.data
        assert(
            typeof token !== `undefined`,
            new Error(`TwitchAPI/getToken: token is undefined`)
        )

        return token
    }
}
