import { logEntry } from "../../../utils/logEntry"
import { StreamerSelectionLogic } from "./streamerSelectionLogic"

export const streamerSelection = async () => {
  logEntry({
    message: `start update streamer info`,
    severity: `INFO`,
  })

  try {
    const findOutNewStreamer = await StreamerSelectionLogic.init()

    /* ==================================
        Update existing streamer information
        ================================== */
    const { oldStreamerIds, oldStreamers } =
      await findOutNewStreamer.getOldStreamer()

    /* ==================================
        Find out new streamer
        ================================== */
    const stream = await findOutNewStreamer.getJpLiveStreaming()
    const newStreamerIds = findOutNewStreamer.filterStreams(
      stream,
      oldStreamerIds,
    )
    const newStreamers =
      await findOutNewStreamer.getNewStreamerFollower(newStreamerIds)

    /* ==================================
        Filter streamer
        ================================== */
    const { addedStreamerIds, removedStreamerIds, selectedStreamers } =
      findOutNewStreamer.concatAndFilter(oldStreamers, newStreamers)
    const { banedIds, storedStreamers } =
      await findOutNewStreamer.updateStreamerInfo(selectedStreamers)

    /* ==================================
        update Firestore
        ================================== */
    await findOutNewStreamer.updateFirestore(
      storedStreamers,
      removedStreamerIds.concat(banedIds),
      // addedStreamerIds
    )

    logEntry({
      message: `update streamer info: add ${addedStreamerIds.length}, delete ${removedStreamerIds.length} (total:${storedStreamers.length})`,
      severity: `INFO`,
    })
  } catch (error) {
    logEntry({
      message: `Failed update streamer info: \n${error}`,
      severity: `ERROR`,
    })
  }
}
