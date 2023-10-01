import * as functions from "firebase-functions"

import { StreamerSelectionLogic } from "./streamerSelectionLogic"

export const streamerSelection = functions
    .region(`asia-northeast1`)
    .runWith({
        timeoutSeconds: 300,
        secrets: [`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`]
    })
    .pubsub.schedule(`30 5,11,17,23 * * *`)
    .timeZone(`Asia/Tokyo`)
    .onRun(async () => {
        const findoutNewStreamer = await StreamerSelectionLogic.init()

        /* ==================================
        Update existing streamer information
        ================================== */
        const { oldStreamers, oldStreamerIds } = await findoutNewStreamer.getOldStreamer()

        /* ==================================
        Find out new streamer
        ================================== */
        const stream = await findoutNewStreamer.getJpLiveStreaming()
        const newStreamerIds = findoutNewStreamer.filterStreams(stream, oldStreamerIds)
        const newStreamers =
            await findoutNewStreamer.getNewStreamerFollower(newStreamerIds)
        const { selectedStreamers, removedStreamerIds, addedStreamerIds } =
            findoutNewStreamer.concatAndFilter(oldStreamers, newStreamers)
        const storedStreamers =
            await findoutNewStreamer.updateStreamerInfo(selectedStreamers)

        /* ==================================
        update Firestore
        ================================== */
        await findoutNewStreamer.updateFirestore(
            storedStreamers,
            removedStreamerIds,
            // addedStreamerIds
        )

        functions.logger.info(
            `add ${addedStreamerIds.length}, delete ${removedStreamerIds.length} (total:${storedStreamers.length})`
        )
    })
