import * as functions from "firebase-functions";
import { StreamerRepository } from "../../repositories/streamer";
import { newStreamerLoginsConverter } from "../../converters/newStreamerLoginsConverter";
import { TwitchStreamerApi } from "~/src/apis/streamer";
import { ClipRepository } from "~/src/repositories/clip";

//add new streamer
export const onAddStreamer = functions
    .region(`asia-northeast1`)
    .runWith({
        secrets: [
            `TWITCH_CLIENT_ID`,
            `TWITCH_CLIENT_SECRET`,
        ],
    })
    .firestore.document(`/streamers/new`)
    .onUpdate(async (change) => {
        const streamerRepository = new StreamerRepository();
        const clipRepository = new ClipRepository();
        //get change
        const fetchfromfirestore = newStreamerLoginsConverter.fromFirestore(change.after);
        //if exist new
        if (fetchfromfirestore.logins.length != 0) {
            //check aleady exist
            const firestoreStreamers = await streamerRepository.getStreamers();
            const addLogins: Array<string> = [];
            for (const key in fetchfromfirestore.logins) {
                const login = fetchfromfirestore.logins[key];
                if (!firestoreStreamers.find(e => e.login === login)) {
                    addLogins.push(login);
                } else {
                    functions.logger.info(`login: ${login} is aleady exist`);
                }
            }
            if (addLogins.length == 0) {
                functions.logger.info(`have no streamer to add`);
                return;
            }

            const twitchStreamerApi = await TwitchStreamerApi.init(
                process.env.TWITCH_CLIENT_ID!,
                process.env.TWITCH_CLIENT_SECRET!
            );
            const streamers = await twitchStreamerApi.getStreamers(
                addLogins,
                false,
            )

            //if streamers length 0
            if (streamers.length == 0) {
                functions.logger.info(`cant get streamer info. expect wrong login`);
                return;
            }
            //post streamers to firestore
            await streamerRepository.addStreamers(streamers);
            //create clip docs
            for (const key in streamers) {
                await clipRepository.createClipDoc(streamers[key].id);
            }

            //delete login from new doc;
            await streamerRepository.deleteLogins(fetchfromfirestore.logins);

            functions.logger.info(`add ${streamers.length} streamers`);
        }

    });