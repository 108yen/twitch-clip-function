import {
  CollectionReference,
  DocumentReference,
} from "firebase-admin/firestore"

import { clipDocConverter } from "../converters/clipDocConverter"
import { ClipDoc } from "../models/clipDoc"
import { db } from "./db"

export const clipColRef: CollectionReference<ClipDoc> = db
  .collection(`clips`)
  .withConverter<ClipDoc>(clipDocConverter)

export const clipDocRef = ({
  clipId,
}: {
  clipId: string
}): DocumentReference<ClipDoc> => clipColRef.doc(clipId)
