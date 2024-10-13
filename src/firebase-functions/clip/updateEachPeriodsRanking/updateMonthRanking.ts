import { logEntry } from "../../../utils/logEntry"
import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateMonthRanking = async () => {
  logEntry({
    message: `start update month ranking`,
    severity: `INFO`,
  })

  try {
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(
      `month`,
      30,
    )
    await updateEachPeriodsRanking.run()
  } catch (error) {
    logEntry({
      message: `Failed update month ranking: \n${error}`,
      severity: `ERROR`,
    })
  }
}
