import { logEntry } from "../../../utils/logEntry"
import { UpdateDailyRankingLogic } from "./logic/updateDailyRankingLogic"
import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateDayRanking = async () => {
  logEntry({
    message: "start update day ranking",
    severity: "INFO",
  })

  try {
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(
      "day",
      1,
    )
    const clipDoc = await updateEachPeriodsRanking.run()
    const updateDailyRankingLogic = new UpdateDailyRankingLogic(clipDoc)
    await updateDailyRankingLogic.update()
  } catch (error) {
    logEntry({
      message: `Failed update day ranking: \n${error}`,
      severity: "ERROR",
    })
  }
}
