import * as admin from "firebase-admin";

// Firebase Admin SDK の初期化
// https://firebase.google.com/docs/functions/config-env?hl=ja
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    })
}

//deploy function
import { updateStreamer } from "./firebase-functions/streamer/updateStreamer";
import { onAddStreamer } from "./firebase-functions/streamer/onAddStreamer";
import { getTwitchClipFunction } from "./firebase-functions/clip/getTwitchClipFunction";

export {
    updateStreamer,
    onAddStreamer,
    getTwitchClipFunction,
}


// //for each streamer, get all period clip
// async function getAllPeriodClips(
//     id: string,
//     client_id: string,
//     token: Token,
// ): Promise<Array<Clip>> {
//     //get twitch clips from twitch api
//     const clips: Array<Clip> = await getClips(
//         parseInt(id),
//         client_id,
//         token,
//         -1, //if all period, this val is -1
//     );
//     return clips;
// }

// async function getClips(
//     broadcaster_id: number,
//     client_id: string,
//     token: Token,
//     days: number
// ): Promise<Array<Clip>> {
//     let config: AxiosRequestConfig;
//     //if period is all
//     if (days == -1) {
//         config = {
//             url: 'https://api.twitch.tv/helix/clips',
//             method: 'GET',
//             headers: {
//                 'Authorization': 'Bearer ' + token.access_token,
//                 'Client-Id': client_id,
//             },
//             params: {
//                 'broadcaster_id': broadcaster_id,
//                 'first': CLIP_NUM,
//             }
//         }
//         //else period
//     } else {
//         const now = new Date(); // get present date
//         const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000); //days ago

//         config = {
//             url: 'https://api.twitch.tv/helix/clips',
//             method: 'GET',
//             headers: {
//                 'Authorization': 'Bearer ' + token.access_token,
//                 'Client-Id': client_id,
//             },
//             params: {
//                 'broadcaster_id': broadcaster_id,
//                 'first': CLIP_NUM,
//                 'started_at': daysAgo.toISOString(),
//                 'ended_at': now.toISOString(),
//             }
//         }
//     }
//     const res = await axios(config)
//         .catch(() => {
//             console.log('clip fetch error');
//         });
//     return res?.data.data;
// }

// async function getYearRankingForEachStreamer(
//     streamer: Streamer,
//     client_id: string,
//     token: Token,
// ): Promise<Map<string, Array<Clip>> | undefined> {
//     let result = new Map<string, Array<Clip>>();

//     //if undefined
//     if (streamer.created_at == undefined) {
//         console.log(streamer.id + ': created_at is undefined');
//         return undefined;
//     }
//     //get start year
//     const created_at = new Date(streamer.created_at);
//     //at least, from 2016
//     const start_year = created_at.getFullYear() < 2016 ? 2016 : created_at.getFullYear();
//     const current_year = new Date().getFullYear();
//     //if created current year
//     if (start_year == current_year) {
//         return undefined;
//     }
//     //get foreach year clip ranking
//     for (let year = start_year; year < current_year; year++) {
//         const clips = await getClipsYear(
//             parseInt(streamer.id),
//             year,
//             client_id,
//             token
//         );
//         //if exist
//         if (clips.length != 0) {
//             result.set(
//                 year.toString(),
//                 clips,
//             );
//         }
//     }
//     //if exist result
//     if (result.size != 0) {
//         return result;
//     }
//     return undefined;
// }

// async function getClipsYear(
//     broadcaster_id: number,
//     year: number,
//     client_id: string,
//     token: Token,
// ): Promise<Array<Clip>> {
//     const started_at = new Date(year, 0, 1, 0, 0);
//     const ended_at = new Date(year, 11, 31, 23, 59);

//     const config: AxiosRequestConfig = {
//         url: 'https://api.twitch.tv/helix/clips',
//         method: 'GET',
//         headers: {
//             'Authorization': 'Bearer ' + token.access_token,
//             'Client-Id': client_id,
//         },
//         params: {
//             'broadcaster_id': broadcaster_id,
//             'first': CLIP_NUM,
//             'started_at': started_at.toISOString(),
//             'ended_at': ended_at.toISOString(),
//         }
//     }
//     const res = await axios(config)
//         .catch(() => {
//             console.log('clip fetch error');
//         });
//     return res?.data.data;
// }