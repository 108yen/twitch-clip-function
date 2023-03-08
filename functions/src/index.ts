import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios, { AxiosRequestConfig } from "axios";
import { FieldValue } from "firebase-admin/firestore";

//add new streamer every month 1st
export const addStreamer = functions
    .region("asia-northeast1")
    .runWith({
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .pubsub.schedule("*/5 * * * *")
    // .pubsub.schedule("0 0 1 * *")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        //initialize firebase app
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        const db = admin.firestore();
        //get new streamers login from firestore
        const doc = await db.collection("streamers").doc("new").get();
        const fetchfromfirestore: { logins: Array<string> } = doc.data() as { logins: Array<string> };
        //if exist new
        if (fetchfromfirestore.logins.length != 0) {
            //get twitch api token
            const twitchToken = await getToken(
                process.env.TWITCH_CLIENT_ID!,
                process.env.TWITCH_CLIENT_SECRET!
            );
            //get streamers info from twitch api
            const streamers = await getStreamersSlice(fetchfromfirestore.logins, twitchToken);
            //post streamers to firestore
            await db.collection("streamers").doc("streamers").update({
                streamers: FieldValue.arrayUnion(...streamers)
            });
            //delete login from new doc
            await db.collection("streamers").doc("new").update({
                logins: FieldValue.arrayRemove(...fetchfromfirestore.logins)
            });
        }
    });


//get twitch clip every day twice
export const getTwitchClipFunction = functions
    .region("asia-northeast1")
    .runWith({
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .pubsub.schedule("0 10,22 * * *")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        //initialize firebase app
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        const db = admin.firestore();
        //get streamers info from firestore
        const doc = await db.collection("streamers").doc("streamers").get();
        const fetchfromfirestore: { streamers: Array<Streamer> } = doc.data() as { streamers: Array<Streamer> };
        const streamerIds = fetchfromfirestore.streamers.map(streamer => streamer.id);

        //get twitch api token
        const twitchToken = await getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        //loop each period
        const dayList: { [key: string]: number } = {
            day: 1,
            week: 7,
            month: 30,
            // all:?
        };
        for (const key in dayList) {
            //get twitch clips from twitch api
            const clips: Array<Clip> = await getStreamersClips(
                streamerIds,
                process.env.TWITCH_CLIENT_ID!,
                twitchToken,
                dayList[key],
            );
            //post clips to firestore
            await db.collection("clips").doc(key).set({
                "clips": clips
            });
        }
    });
//type

type Streamer = {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    created_at: string;
}

type Clip = {
    id: string;
    url: string;
    embed_url: string;
    broadcaster_id: string;
    broadcaster_name: string;
    creator_id: string;
    creator_name: string;
    video_id: string;
    game_id: string;
    language: string;
    title: string;
    view_count: number;
    created_at: string;
    thumbnail_url: string;
    duration: number;
    vod_offset: number;
}

type Token = {
    access_token: string;
    expires_in: number;
    token_type: string;
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

const sortByViewconut = (clips: Array<Clip>) => {
    return clips
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 10);
}

async function getStreamersClips(
    ids: Array<string>,
    client_id: string,
    token: Token,
    days: number
): Promise<Array<Clip>> {
    let result: Array<Clip> = [];
    for (const key in ids) {
        const element = ids[key];
        const id: number = parseInt(element);
        if (isNaN(id)) {
            console.log(`${element}はnumberではありません。`);
        } else {
            result = result.concat(await getClips(
                id,
                client_id,
                token,
                days
            ));
        }
    }
    return sortByViewconut(result);
}

async function getClips(
    broadcaster_id: number,
    client_id: string,
    token: Token,
    days: number
): Promise<Array<Clip>> {
    const now = new Date(); // 現在の日付を取得
    const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000); //何日前か

    const config: AxiosRequestConfig = {
        url: 'https://api.twitch.tv/helix/clips',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
            'Client-Id': client_id,
        },
        params: {
            'broadcaster_id': broadcaster_id,
            'first': 20,
            'started_at': daysAgo.toISOString(),
        }
    }
    const res = await axios(config)
        .catch(() => {
            console.log('clip fetch error');
        });
    return res?.data.data;
}

async function getStreamersSlice(
    logins: Array<string>,
    token: Token,
): Promise<Array<Streamer>> {
    const chunkSize = 100;
    const numChunks = Math.ceil(logins.length / chunkSize);
    let streamers: Array<Streamer> = [];

    for (let i = 0; i < numChunks; i++) {
        streamers = streamers.concat(
            await getStreamers(
                logins.slice(i * chunkSize, (i + 1) * chunkSize),
                token,
            )
        );
    }
    return streamers;
}

async function getStreamers(
    logins: Array<string>,
    token: Token,
): Promise<Array<Streamer>> {

    const config: AxiosRequestConfig = {
        url: 'https://api.twitch.tv/helix/users',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
            'Client-Id': 'k5nfeu9zzvc4egiaszxzemst6lqljt',
        },
        params: {
            login: logins,
        },
        paramsSerializer: { indexes: null }
    }
    const res = await axios(config);

    return res?.data.data;
}