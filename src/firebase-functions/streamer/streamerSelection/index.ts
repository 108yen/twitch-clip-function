import { StreamerSelectionLogic } from "./streamerSelectionLogic"

export const streamerSelection = async () => {
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
    const { selectedStreamers, removedStreamerIds } = findoutNewStreamer.concatAndFilter(
        oldStreamers,
        newStreamers
    )
    const storedStreamers = await findoutNewStreamer.updateStreamerInfo(selectedStreamers)

    /* ==================================
        update Firestore
        ================================== */
    await findoutNewStreamer.updateFirestore(
        storedStreamers,
        removedStreamerIds
        // addedStreamerIds
    )
}
