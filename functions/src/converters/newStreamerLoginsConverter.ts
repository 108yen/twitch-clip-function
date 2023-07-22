import { FirestoreDataConverter } from "firebase-admin/firestore";

export const newStreamerLoginsConverter: FirestoreDataConverter<{ logins: Array<string> }> = {
    fromFirestore(qds: FirebaseFirestore.QueryDocumentSnapshot): { logins: Array<string> }{
        const data = qds.data() as { logins: Array<string> };
        return data;
    },
    toFirestore(doc: { logins: Array<string> }): FirebaseFirestore.DocumentData{
        return doc;
    }
}