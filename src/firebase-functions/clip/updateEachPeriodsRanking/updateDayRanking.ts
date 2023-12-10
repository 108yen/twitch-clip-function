import { logEntry } from "../../../utils/logEntry"

import { UpdateDailyRankingLogic } from "./logic/updateDailyRankingLogic"
import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateDayRanking = async () => {
    logEntry({
        severrity: `INFO`,
        message: `start updateDayRanking`
    })
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`day`, 1)
    const clipDoc = await updateEachPeriodsRanking.run()
    const updateDailyRankingLogic = new UpdateDailyRankingLogic(clipDoc)
    await updateDailyRankingLogic.update()
}
