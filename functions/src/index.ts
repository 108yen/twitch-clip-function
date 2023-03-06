import * as functions from "firebase-functions";

// export const helloWorld = functions.https.onRequest((request, response) => {
//     functions.logger.info("Hello logs!", { structuredData: true });
//     response.send("Hello from Firebase!");
// });

export const scheduledFunction = functions
    .region("asia-northeast1")
    .pubsub.schedule("0 0 * * *")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        console.log(new Date());
    });