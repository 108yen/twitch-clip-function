import { logEntry } from "../../../utils/logEntry"
import { StreamerSelectionLogic } from "./streamerSelectionLogic"

export const streamerSelection = async () => {
  logEntry({
    message: "start update streamer info",
    severity: "INFO",
  })

  try {
    const findOutNewStreamer = await StreamerSelectionLogic.init()

    /**
     *  ==================================
     *  Fetch old streamer and update existing streamer follower num
     *  ==================================
     */
    const { oldStreamerIds, oldStreamers } =
      await findOutNewStreamer.getOldStreamer()

    /**
     *  ==================================
     *  Find out new streamer and store follower num
     *  ==================================
     */
    const stream = await findOutNewStreamer.getJpLiveStreaming()
    const newStreamerIds = findOutNewStreamer.filterStreams(
      stream,
      oldStreamerIds,
    )
    const newStreamers =
      await findOutNewStreamer.getNewStreamerFollower(newStreamerIds)

    /**
     *  ==================================
     *  Filter streamer by follower num
     *  ==================================
     */
    const { addedStreamerIds, removedStreamerIds, selectedStreamers } =
      findOutNewStreamer.concatAndFilter(oldStreamers, newStreamers)
    const { banedIds, storedStreamers } =
      await findOutNewStreamer.updateStreamerInfo(selectedStreamers)

    /**
     *  ==================================
     *  Add team info
     *  ==================================
     */
    const computedStreamer = await findOutNewStreamer.storeTeam(storedStreamers)

    /**
     *  ==================================
     *  Update Firestore
     *  ==================================
     */
    await findOutNewStreamer.updateFirestore(
      computedStreamer,
      removedStreamerIds.concat(banedIds),
    )

    logEntry({
      message: `update streamer info: add ${addedStreamerIds.length}, delete ${removedStreamerIds.length} (total:${storedStreamers.length})`,
      severity: "INFO",
    })
  } catch (error) {
    logEntry({
      message: `Failed update streamer info: \n${error}`,
      severity: "ERROR",
    })
  }
}
