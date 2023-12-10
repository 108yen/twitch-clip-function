import { logEntry } from "../../../utils/logEntry"

import { StreamerSelectionLogic } from "./streamerSelectionLogic"

export const streamerSelection = async () => {
    logEntry({
        severity: `INFO`,
        message: `start streamerSelection`
    })
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
    const newStreamers = await findoutNewStreamer.getNewStreamerFollower(newStreamerIds)
    const { selectedStreamers, removedStreamerIds, addedStreamerIds } =
        findoutNewStreamer.concatAndFilter(oldStreamers, newStreamers)
    const storedStreamers = await findoutNewStreamer.updateStreamerInfo(selectedStreamers)

    /* ==================================
        update Firestore
        ================================== */
    await findoutNewStreamer.updateFirestore(
        storedStreamers,
        removedStreamerIds
        // addedStreamerIds
    )

    logEntry({
        severity: `INFO`,
        message: `update streamer info: add ${addedStreamerIds.length}, delete ${removedStreamerIds.length} (total:${storedStreamers.length})`
    })
}
