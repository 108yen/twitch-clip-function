import axios, { AxiosRequestConfig } from "axios";
import { streamersDocRef } from "../firestore-refs/streamerRefs";
import { Streamer } from "../models/streamer";
import { Token } from "../models/token";
import * as functions from "firebase-functions";

export class StreamerRepository {
    async fetchFirestoreStreamers(): Promise<Array<Streamer>> {
        const ds = await streamersDocRef.get();
        if (!ds.data()) {
            throw new Error(`streamersの取得に失敗しました。`);
        }

        return ds.data()!.streamers;
    }

    async fetchFollowerNum(
        id: string,
        client_id: string,
        token: Token,
    ): Promise<number> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/channels/followers`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${token.access_token}`,
                [`Client-Id`]: client_id,
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

    async fetchTwitchStreamers(
        ids: Array<string>,
        isId: boolean,
        client_id: string,
        token: Token,
    ): Promise<Array<Streamer>> {
        const chunkSize = 100;
        const numChunks = Math.ceil(ids.length / chunkSize);
        let streamers: Array<Streamer> = [];

        if (isId) {
            for (let i = 0; i < numChunks; i++) {
                streamers = streamers.concat(
                    await this.getStreamers(
                        null,
                        ids.slice(i * chunkSize, (i + 1) * chunkSize),
                        client_id,
                        token,
                    )
                );
            }
        } else {
            for (let i = 0; i < numChunks; i++) {
                streamers = streamers.concat(
                    await this.getStreamers(
                        ids.slice(i * chunkSize, (i + 1) * chunkSize),
                        null,
                        client_id,
                        token,
                    )
                );
            }
        }
        return streamers;
    }

    private async getStreamers(
        logins: Array<string> | null,
        ids: Array<string> | null,
        client_id: string,
        token: Token,
    ): Promise<Array<Streamer>> {
        const config: AxiosRequestConfig = {
            url: `https://api.twitch.tv/helix/users`,
            method: `GET`,
            headers: {
                Authorization: `Bearer ${token.access_token}`,
                [`Client-Id`]: client_id,
            },
            paramsSerializer: { indexes: null }
        }
        if (logins != null) {
            config.params = {
                login: logins
            }
        } else if (ids != null) {
            config.params = {
                id: ids
            }
        }
        const res = await axios(config)
            .catch((error) => {
                functions.logger.error(`twitch apiからストリーマー情報の取得に失敗しました: ${error}`);
            });

        return res?.data.data;
    }
}