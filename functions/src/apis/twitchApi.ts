import assert from "assert"

import axios, { AxiosRequestConfig } from "axios"
import * as functions from "firebase-functions"

import { Token } from "../models/token"

export class TwitchApi {
    protected token!: Token
    protected client_id!: string

    constructor(props: { token: Token; client_id: string }) {
        Object.assign(this, props)
    }

    protected static async getToken(client_id: string, client_secret: string) {
        const config: AxiosRequestConfig = {
            url: `https://id.twitch.tv/oauth2/token`,
            method: `POST`,
            headers: {
                [`Content-Type`]: `application/x-www-form-urlencoded`
            },
            params: {
                client_id: client_id,
                client_secret: client_secret,
                grant_type: `client_credentials`
            },
            paramsSerializer: { indexes: null }
        }

        const res = await axios<Token>(config).catch((error) => {
            functions.logger.error(`TwitchAPI/getToken/axios: ${error}`)
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
