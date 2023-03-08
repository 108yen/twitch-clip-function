import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios, { AxiosRequestConfig } from "axios";

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
        const doc = await db
            .collection("streamers")
            .doc("streamers")
            .get();
        const fetchfromfirestore: { streamers: Array<Streamer> } = doc.data() as { streamers: Array<Streamer> };
        const streamerIds = fetchfromfirestore.streamers.map(streamer => streamer.id);
        // const col = db.collection("streamers") as admin.firestore.CollectionReference<Streamer>;
        // const querySnapshot = await col.get();
        // const streamers = querySnapshot.docs.map((doc) => doc.data());
        // const streamerIds = streamers.map(streamer => streamer.id);
        
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
            //get twitch clips
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
    return clips.sort((a, b) => b.view_count - a.view_count);
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
            'first': 10,
            'started_at': daysAgo.toISOString(),
        }
    }
    const res = await axios(config)
        .catch(() => {
            console.log('clip fetch error');
        });
    return res?.data.data;
}