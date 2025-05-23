import assert from "assert"
import { FieldValue } from "firebase-admin/firestore"
import { clipDocRef } from "../firestore-refs/clipRefs"
import { ClipDoc } from "../models/clipDoc"

export class ClipRepository {
  batchCreateClipDoc(clipId: string, batch: FirebaseFirestore.WriteBatch) {
    batch.set(clipDocRef({ clipId }), new ClipDoc())
  }

  batchDeleteClipDoc(clipId: string, batch: FirebaseFirestore.WriteBatch) {
    batch.delete(clipDocRef({ clipId }))
  }

  batchDeleteFieldValue(
    clipId: string,
    key: string,
    batch: FirebaseFirestore.WriteBatch,
  ) {
    batch.update(clipDocRef({ clipId }), { [key]: FieldValue.delete() })
  }

  batchUpdateClip(
    clipId: string,
    clipDoc: ClipDoc,
    batch: FirebaseFirestore.WriteBatch,
  ) {
    batch.set(clipDocRef({ clipId }), clipDoc, { merge: true })
  }

  async createClipDoc(clipId: string) {
    await clipDocRef({ clipId })
      .set(new ClipDoc())
      .catch((error) => {
        console.error(`ClipRepository/createClipDoc/clipDocRef.set():${error}`)
        throw new Error(error)
      })
  }

  async deleteClipDoc(clipId: string) {
    await clipDocRef({ clipId })
      .delete()
      .catch((error) => {
        console.error(
          `ClipRepository/createClipDoc/clipDocRef.delete():${error}`,
        )
        throw new Error(error)
      })
  }

  async getClip(clipId: string): Promise<ClipDoc> {
    const ds = await clipDocRef({ clipId })
      .get()
      .catch((error) => {
        console.error(`ClipRepository/getClip/clipDocRef.get(): ${error}`)
        throw new Error(error)
      })
    const clipDoc = ds?.data()
    assert(
      typeof clipDoc !== "undefined",
      new Error(
        `ClipRepository/getClip/clipDocRef.get(): clipId: ${clipId}, clipDoc is undefined`,
      ),
    )

    return clipDoc
  }

  async setClip(clipId: string, clipDoc: ClipDoc) {
    await clipDocRef({ clipId })
      .set(clipDoc, { merge: false })
      .catch((error) => {
        console.error(`ClipRepository/updateClip/clipDocRef.set():${error}`)
        throw new Error(error)
      })
  }

  async updateClip(clipId: string, clipDoc: ClipDoc) {
    await clipDocRef({ clipId })
      .set(clipDoc, { merge: true })
      .catch((error) => {
        console.error(`ClipRepository/updateClip/clipDocRef.set():${error}`)
        throw new Error(error)
      })
  }
}
