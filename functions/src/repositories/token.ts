import axios, { AxiosRequestConfig } from "axios";
import * as functions from "firebase-functions";
import { Token } from "../models/token";

export async function getToken(client_id: string, client_secret: string) {
    const config: AxiosRequestConfig = {
        url: 'https://id.twitch.tv/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: {
            client_id: client_id,
            client_secret: client_secret,
            grant_type: 'client_credentials',
        },
        paramsSerializer: { indexes: null }
    }

    const res = await axios<Token>(config)
        .catch((error) => {
            functions.logger.error(`twitch tokenの取得に失敗しました: ${error}`);
        });
    //null check
    if (!(res?.data)) {
        functions.logger.error(`twitch tokenの取得に失敗しました`);
    }
    const result = res!.data!;

    return result;
}