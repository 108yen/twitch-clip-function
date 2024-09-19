import { logEntry } from "../../../utils/logEntry"

import { StreamerSelectionLogic } from "./streamerSelectionLogic"

export const streamerSelection = async () => {
    logEntry({
        severity: `INFO`,
        message: `start update streamer info`
    })

    try {
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
        const newStreamers = await findoutNewStreamer.getNewStreamerFollower(
            newStreamerIds
        )

        /* ==================================
        Filter streamer
        ================================== */
        const { selectedStreamers, removedStreamerIds, addedStreamerIds } =
            findoutNewStreamer.concatAndFilter(oldStreamers, newStreamers)
        const { storedStreamers, banedIds } = await findoutNewStreamer.updateStreamerInfo(
            selectedStreamers
        )

        /* ==================================
        update Firestore
        ================================== */
        await findoutNewStreamer.updateFirestore(
            storedStreamers,
            removedStreamerIds.concat(banedIds)
            // addedStreamerIds
        )

        logEntry({
            severity: `INFO`,
            message: `update streamer info: add ${addedStreamerIds.length}, delete ${removedStreamerIds.length} (total:${storedStreamers.length})`
        })
    } catch (error) {
        logEntry({
            severity: `ERROR`,
            message: `Failed update streamer info: \n${error}`
        })
    }
}
