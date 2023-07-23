import { DocumentReference } from "firebase-admin/firestore";
import { Streamer } from "../models/streamer";
import { streamerConverter } from "../converters/streamerConverter";
import { newStreamerLoginsConverter } from "../converters/newStreamerLoginsConverter";
import { db } from "./db";

export const streamersDocRef: DocumentReference<{ streamers: Array<Streamer> }> = db
    .collection(`streamers`)
    .doc(`streamers`)
    .withConverter<{ streamers: Array<Streamer> }>(streamerConverter);

export const newStreamerLoginsDocRef: DocumentReference<{ logins: Array<string> }> = db
    .collection(`streamers`)
    .doc(`new`)
    .withConverter<{ logins: Array<string> }>(newStreamerLoginsConverter);