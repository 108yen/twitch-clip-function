import { DocumentReference } from "firebase-admin/firestore"

import { streamerConverter } from "../converters/streamerConverter"
import { Streamer } from "../models/streamer"

import { db } from "./db"

export const streamersDocRef: DocumentReference<{ streamers: Array<Streamer> }> = db
    .collection(`streamers`)
    .doc(`streamers`)
    .withConverter<{ streamers: Array<Streamer> }>(streamerConverter)
