import * as functions from "firebase-functions"

import { db } from "../firestore-refs/db"

export class BatchRepository {
    private batch: FirebaseFirestore.WriteBatch
    private chunck = 0
    private chunckLimit: number
    constructor(chunckLimit = 100) {
        this.chunckLimit = chunckLimit
        this.batch = db.batch()
    }
    async getBatch() {
        if (this.chunck > this.chunckLimit) {
            await this.commitBatch()
        }
        this.chunck++
        return this.batch
    }

    //batch commit request need less than 10MiB
    async commitBatch() {
        this.chunck = 0
        await this.batch.commit().catch((error) => {
            functions.logger.error(
                `BatchRepository/commitBatch/this.batch.commit():${error}`
            )
            throw new Error(error)
        })
        this.batch = db.batch()
    }
}
