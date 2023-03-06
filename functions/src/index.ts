import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

type User = {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    created_at: string;
}

export const scheduledFunction = functions
    .region("asia-northeast1")
    .pubsub.schedule("0 0 * * *")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        const col = admin.firestore().collection("streamers") as admin.firestore.CollectionReference<User>;
        const querySnapshot = await col.get();
        const users = querySnapshot.docs.map((doc) => doc.data());

        console.log(new Date());
        console.log(JSON.stringify(users));
    });