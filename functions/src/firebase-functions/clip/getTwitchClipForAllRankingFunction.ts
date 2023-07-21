
//get twitch clip every month 1st and 16 for all ranking
export const getTwitchClipForAllRankingFunction = functions
    .region("asia-northeast1")
    .runWith({
        timeoutSeconds: 300,
        secrets: [
            'TWITCH_CLIENT_ID',
            'TWITCH_CLIENT_SECRET',
        ],
    })
    .pubsub.schedule("0 1 1,16 * *")
    .timeZone("Asia/Tokyo")
    .onRun(async () => {
        //initialize firebase app
        if (!getApps().length) {
            admin.initializeApp({ credential: admin.credential.applicationDefault() });
        }
        const db = admin.firestore();
        db.settings({ ignoreUndefinedProperties: true });
        //get streamers info from firestore
        const doc = await db.collection("streamers").doc("streamers").get();
        const fetchfromfirestore: { streamers: Array<Streamer> } = doc.data() as { streamers: Array<Streamer> };
        const streamerIds = fetchfromfirestore.streamers.map(streamer => streamer.id);

        //get twitch api token
        const twitchToken = await getToken(
            process.env.TWITCH_CLIENT_ID!,
            process.env.TWITCH_CLIENT_SECRET!
        );
        //for summary ranking
        let summary: Array<Clip> = [];
        //get for each streamer's clips
        for (const key in streamerIds) {
            const clips = await getAllPeriodClips(
                streamerIds[key],
                process.env.TWITCH_CLIENT_ID!,
                twitchToken,
            );
            //post each streamer clips to firestore
            //todo:batch
            await db.collection("clips").doc(streamerIds[key]).update({
                "all": clips,
            });
            //push to summary
            summary = summary.concat(clips);
        }

        //make summary ranking
        summary = sortByViewconut(summary);
        //post summary clips to firestore
        await db.collection("clips").doc("summary").update({
            "all": summary,
        });
    });
