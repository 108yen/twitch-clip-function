import { db } from "../firestore-refs/db"

export class BatchRepository {
    private batch: FirebaseFirestore.WriteBatch
    private chunk = 0
    private chunkLimit: number
    constructor(chunkLimit = 100) {
        this.chunkLimit = chunkLimit
        this.batch = db.batch()
    }
    //batch commit request need less than 10MiB
    async commitBatch() {
        this.chunk = 0
        await this.batch.commit().catch((error) => {
            console.error(
                `BatchRepository/commitBatch/this.batch.commit():${error}`
            )
            throw new Error(error)
        })
        this.batch = db.batch()
    }

    async getBatch() {
        if (this.chunk > this.chunkLimit) {
            await this.commitBatch()
        }
        this.chunk++
        return this.batch
    }
}
