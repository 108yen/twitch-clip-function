import axios, { AxiosRequestConfig } from "axios";
import * as functions from "firebase-functions";
import { StreamerRepository } from "../../repositories/streamer";
import { streamersDocRef } from "../../firestore-refs/streamerRefs";
import { Streamer } from "../../models/streamer";


//update streamer info every wed
export const updateStreamer = functions
    .region("asia-northeast1")
    .runWith({
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .pubsub.schedule("0 21 * * 3")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        const streamerRepository = new StreamerRepository();
        const fetchStreamers = await streamerRepository.fetchStreamers();
        if (!fetchStreamers) {
            functions.logger.error("streamersの取得に失敗しました。");
            return;
        }
        const streamerIds = fetchStreamers.map(streamer => streamer.id);
        //get twitch api token
        const twitchToken = await getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        //get streamers info from twitch api
        let streamers = await getStreamersSlice(
            streamerIds,
            true,
            process.env.TWITCH_CLIENT_ID!,
            twitchToken,
        );
        //for each streamers
        for (const key in streamers) {
            //get follower num from twitch api
            const followerNum = await getFollowerNum(
                streamers[key].id,
                process.env.TWITCH_CLIENT_ID!,
                twitchToken,
            );
            streamers[key].follower_num = followerNum;
        }
        //sort by follower num
        streamers = sortByFollowerNum(streamers);
        try {
            //!間違っているかも　{streamers:streamers}では？　converterでやっているからいいのか？
            await streamersDocRef.update(streamers);
        } catch (error) {
            functions.logger.error(`streamerの更新に失敗しました: ${error}`);
        }

    });


function sortByFollowerNum(streamers: Array<Streamer>) {
    return streamers
        .sort((a, b) => {
            if (b.follower_num == undefined) {
                return -1;
            }
            if (a.follower_num == undefined) {
                return 1;
            }
            return b.follower_num - a.follower_num;
        });
}
//get followers
async function getFollowerNum(
    id: string,
    client_id: string,
    token: Token,
): Promise<number> {
    const config: AxiosRequestConfig = {
        url: 'https://api.twitch.tv/helix/channels/followers',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
            'Client-Id': client_id,
        },
        params: {
            'broadcaster_id': id,
            'first': 1,
        }
    }
    const res = await axios(config)
        .catch(() => {
            console.log('clip fetch error');
        });
    return res?.data.total;
}

//twitch api
async function getToken(client_id: string, client_secret: string) {
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

    const res = await axios(config)
        .catch(() => {
            console.log('get token error');
        });
    const result: Token = res?.data;

    return result;
}
async function getStreamersSlice(
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
                await getStreamers(
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
                await getStreamers(
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

async function getStreamers(
    logins: Array<string> | null,
    ids: Array<string> | null,
    client_id: string,
    token: Token,
): Promise<Array<Streamer>> {
    const config: AxiosRequestConfig = {
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
            'Client-Id': client_id,
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
        .catch(() => {
            console.log('streamer info fetch error');
        });

    return res?.data.data;
}

type Token = {
    access_token: string;
    expires_in: number;
    token_type: string;
}