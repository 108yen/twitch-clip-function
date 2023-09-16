import { db } from "../firestore-refs/db";
import * as functions from "firebase-functions";

export class BatchRepository {
    private batch: FirebaseFirestore.WriteBatch;
    private chunck = 0;
    constructor() {
        this.batch = db.batch();
    }
    async getBatch() {
        if (this.chunck > 400) {
            await this.commitBatch();
        }
        this.chunck++;
        return this.batch;
    }
    async commitBatch() {
        this.chunck = 0;
        await this.batch
            .commit()
            .catch((error) => {
                functions.logger.error(`BatchRepository/commitBatch/this.batch.commit():${error}`)
                throw new Error(error);
            });
        this.batch = db.batch();
    }
}