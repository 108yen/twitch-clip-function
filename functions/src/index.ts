import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios, { AxiosRequestConfig } from "axios";
import { getApps } from "firebase-admin/app";

const CLIP_NUM = 100;

//initialize firebase app
admin.initializeApp({ credential: admin.credential.applicationDefault() });

//deploy function
import { updateStreamer } from "./firebase-functions/streamer/updateStreamer";
import { onAddStreamer } from "./firebase-functions/streamer/onAddStreamer";

export {
    updateStreamer,
    onAddStreamer,
}

//get twitch clip ranking for each year
export const getYearRankingFunction = functions
    .region("asia-northeast1")
    .runWith({
        timeoutSeconds: 300,
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .pubsub.schedule("0 1 4 * *")
    .timeZone("Asia/Tokyo")
    .onRun(
        async () => {
            //initialize firebase app
            if (!getApps().length) {
                admin.initializeApp({ credential: admin.credential.applicationDefault() });
            }
            const db = admin.firestore();

            db.settings({ ignoreUndefinedProperties: true });
            //get streamers info from firestore
            const doc = await db.collection("streamers").doc("streamers").get();
            const fetchfromfirestore: { streamers: Array<Streamer> } = doc.data() as { streamers: Array<Streamer> };
            const streamers = fetchfromfirestore.streamers;

            //get twitch api token
            const twitchToken = await getToken(
                process.env.TWITCH_CLIENT_ID!,
                process.env.TWITCH_CLIENT_SECRET!
            );
            //for summary ranking
            let summary: Map<string, Array<Clip>> = new Map<string, Array<Clip>>();
            //get for each streamer's clips
            for (const key in streamers) {
                const clips = await getYearRankingForEachStreamer(
                    streamers[key],
                    process.env.TWITCH_CLIENT_ID!,
                    twitchToken,
                )
                if (clips != undefined) {
                    //push to firestore
                    const clipsObj = Object.fromEntries(clips.entries());
                    await db.collection("clips").doc(streamers[key].id).update(clipsObj);
                    //for each year, push to summary
                    for (const [year, yearOfClips] of clips) {
                        if (summary.has(year)) {
                            //if aleady exist year in summary
                            const sorted = sortByViewconut(yearOfClips.concat(summary.get(year)!));
                            summary.set(year, sorted);
                        } else {
                            //if not
                            summary.set(year, yearOfClips);
                        }
                    }
                }
            }
            //push summary to firestore
            const summaryObj = Object.fromEntries(summary.entries());
            await db.collection("clips").doc("past_summary").update(summaryObj);
        }
    );

//get twitch clip every month 1st and 16 for all ranking
export const getTwitchClipForAllRankingFunction = functions
    .region("asia-northeast1")
    .runWith({
        timeoutSeconds: 300,
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .pubsub.schedule("0 1 1,16 * *")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        //initialize firebase app
        if (!getApps().length) {
            admin.initializeApp({ credential: admin.credential.applicationDefault() });
        }
        const db = admin.firestore();
        db.settings({ ignoreUndefinedProperties: true });
        //get streamers info from firestore
        const doc = await db.collection("streamers").doc("streamers").get();
        const fetchfromfirestore: { streamers: Array<Streamer> } = doc.data() as { streamers: Array<Streamer> };
        const streamerIds = fetchfromfirestore.streamers.map(streamer => streamer.id);

        //get twitch api token
        const twitchToken = await getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        //for summary ranking
        let summary: Array<Clip> = [];
        //get for each streamer's clips
        for (const key in streamerIds) {
            const clips = await getAllPeriodClips(
                streamerIds[key],
                process.env.TWITCH_CLIENT_ID!,
                twitchToken,
            );
            //post each streamer clips to firestore
            //todo:batch
            await db.collection("clips").doc(streamerIds[key]).update({
                "all": clips,
            });
            //push to summary
            summary = summary.concat(clips);
        }

        //make summary ranking
        summary = sortByViewconut(summary);
        //post summary clips to firestore
        await db.collection("clips").doc("summary").update({
            "all": summary,
        });
    });

//get twitch clip every day
export const getTwitchClipFunction = functions
    .region("asia-northeast1")
    .runWith({
        timeoutSeconds: 300,
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .pubsub.schedule("0 0,6,12,18 * * *")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        //initialize firebase app
        if (!getApps().length) {
            admin.initializeApp({ credential: admin.credential.applicationDefault() });
        }
        const db = admin.firestore();
        db.settings({ ignoreUndefinedProperties: true });
        //get streamers info from firestore
        const doc = await db.collection("streamers").doc("streamers").get();
        const fetchfromfirestore: { streamers: Array<Streamer> } = doc.data() as { streamers: Array<Streamer> };
        const streamerIds = fetchfromfirestore.streamers.map(streamer => streamer.id);

        //get twitch api token
        const twitchToken = await getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );

        //for summary ranking
        let summary: StreamerClips = {
            day: [],
            week: [],
            month: [],
            year: [],
        };
        //loop each streamer
        for (const key in streamerIds) {
            const clips = await getEachPeriodClips(
                streamerIds[key],
                process.env.TWITCH_CLIENT_ID!,
                twitchToken,
            )
            //post each streamer clips to firestore
            //todo:batch
            await db.collection("clips").doc(streamerIds[key]).update({
                "day": clips.day,
                "week": clips.week,
                "month": clips.month,
                "year": clips.year,
            });
            //push to summary list
            summary.day = summary.day.concat(clips.day);
            summary.week = summary.week.concat(clips.week);
            summary.month = summary.month.concat(clips.month);
            summary.year = summary.year.concat(clips.year);
        }
        //make summary ranking
        summary.day = sortByViewconut(summary.day);
        summary.week = sortByViewconut(summary.week);
        summary.month = sortByViewconut(summary.month);
        summary.year = sortByViewconut(summary.year);

        //post summary clips to firestore
        await db.collection("clips").doc("summary").update(summary);
    });

//type
type Streamer = {
    id: string;
    login: string | undefined;
    display_name: string | undefined;
    type: string | undefined;
    broadcaster_type: string | undefined;
    description: string | undefined;
    profile_image_url: string | undefined;
    offline_image_url: string | undefined;
    view_count: number | undefined;
    created_at: string | undefined;
    follower_num: number | undefined;
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

type StreamerClips = {
    day: Array<Clip>;
    week: Array<Clip>;
    month: Array<Clip>;
    year: Array<Clip>;
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

//sort
//and slice CLIP_NUM
function sortByViewconut(clips: Array<Clip>) {
    return clips
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, CLIP_NUM);
}

//for each streamer, get all period clip
async function getAllPeriodClips(
    id: string,
    client_id: string,
    token: Token,
): Promise<Array<Clip>> {
    //get twitch clips from twitch api
    const clips: Array<Clip> = await getClips(
        parseInt(id),
        client_id,
        token,
        -1, //if all period, this val is -1
    );
    return clips;
}

//for each streamer, get day,week,month period clip
async function getEachPeriodClips(
    id: string,
    client_id: string,
    token: Token,
): Promise<StreamerClips> {
    //loop each period
    const dayList: { [key: string]: number } = {
        day: 1,
        week: 7,
        month: 30,
        year: 365,
    };
    let clipsList: { [key: string]: Array<Clip> } = {};
    for (const key in dayList) {
        //get twitch clips from twitch api
        const clips: Array<Clip> = await getClips(
            parseInt(id),
            client_id,
            token,
            dayList[key],
        )
        clipsList[key] = clips;
    }
    //return this
    const result: StreamerClips = {
        day: clipsList['day'],
        week: clipsList['week'],
        month: clipsList['month'],
        year: clipsList['year'],
    }
    return result;
}

async function getClips(
    broadcaster_id: number,
    client_id: string,
    token: Token,
    days: number
): Promise<Array<Clip>> {
    let config: AxiosRequestConfig;
    //if period is all
    if (days == -1) {
        config = {
            url: 'https://api.twitch.tv/helix/clips',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token.access_token,
                'Client-Id': client_id,
            },
            params: {
                'broadcaster_id': broadcaster_id,
                'first': CLIP_NUM,
            }
        }
        //else period
    } else {
        const now = new Date(); // get present date
        const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000); //days ago

        config = {
            url: 'https://api.twitch.tv/helix/clips',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token.access_token,
                'Client-Id': client_id,
            },
            params: {
                'broadcaster_id': broadcaster_id,
                'first': CLIP_NUM,
                'started_at': daysAgo.toISOString(),
                'ended_at': now.toISOString(),
            }
        }
    }
    const res = await axios(config)
        .catch(() => {
            console.log('clip fetch error');
        });
    return res?.data.data;
}

async function getYearRankingForEachStreamer(
    streamer: Streamer,
    client_id: string,
    token: Token,
): Promise<Map<string, Array<Clip>> | undefined> {
    let result = new Map<string, Array<Clip>>();

    //if undefined
    if (streamer.created_at == undefined) {
        console.log(streamer.id + ': created_at is undefined');
        return undefined;
    }
    //get start year
    const created_at = new Date(streamer.created_at);
    //at least, from 2016
    const start_year = created_at.getFullYear() < 2016 ? 2016 : created_at.getFullYear();
    const current_year = new Date().getFullYear();
    //if created current year
    if (start_year == current_year) {
        return undefined;
    }
    //get foreach year clip ranking
    for (let year = start_year; year < current_year; year++) {
        const clips = await getClipsYear(
            parseInt(streamer.id),
            year,
            client_id,
            token
        );
        //if exist
        if (clips.length != 0) {
            result.set(
                year.toString(),
                clips,
            );
        }
    }
    //if exist result
    if (result.size != 0) {
        return result;
    }
    return undefined;
}

async function getClipsYear(
    broadcaster_id: number,
    year: number,
    client_id: string,
    token: Token,
): Promise<Array<Clip>> {
    const started_at = new Date(year, 0, 1, 0, 0);
    const ended_at = new Date(year, 11, 31, 23, 59);

    const config: AxiosRequestConfig = {
        url: 'https://api.twitch.tv/helix/clips',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
            'Client-Id': client_id,
        },
        params: {
            'broadcaster_id': broadcaster_id,
            'first': CLIP_NUM,
            'started_at': started_at.toISOString(),
            'ended_at': ended_at.toISOString(),
        }
    }
    const res = await axios(config)
        .catch(() => {
            console.log('clip fetch error');
        });
    return res?.data.data;
}