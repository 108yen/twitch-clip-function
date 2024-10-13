import { logEntry } from "../../../utils/logEntry"
import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateWeekRanking = async () => {
  logEntry({
    message: `start update week ranking`,
    severity: `INFO`,
  })

  try {
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(
      `week`,
      7,
    )
    await updateEachPeriodsRanking.run()
  } catch (error) {
    logEntry({
      message: `Failed update week ranking: \n${error}`,
      severity: `ERROR`,
    })
  }
}
