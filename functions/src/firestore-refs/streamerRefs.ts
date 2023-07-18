import * as admin from "firebase-admin";
import { DocumentReference } from "firebase-admin/firestore";
import { Streamer } from "../models/streamer";
import { streamerConverter } from "../converters/streamerConverter";

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

export const streamersDocRef: DocumentReference<Array<Streamer>> = db
    .collection("streamers")
    .doc("streamers")
    .withConverter<Array<Streamer>>(streamerConverter);