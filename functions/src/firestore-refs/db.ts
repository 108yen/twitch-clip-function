import * as admin from "firebase-admin";

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

export {db};