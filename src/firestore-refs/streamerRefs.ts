import { DocumentReference } from "firebase-admin/firestore"

import { streamerConverter } from "../converters/streamerConverter"
import { Streamer } from "../models/streamer"
import { db } from "./db"

export const streamersDocRef: DocumentReference<{
  streamers: Streamer[]
}> = db
  .collection("streamers")
  .doc("streamers")
  .withConverter<{ streamers: Streamer[] }>(streamerConverter)
