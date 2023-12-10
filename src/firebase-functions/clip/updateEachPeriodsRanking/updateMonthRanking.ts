import { logEntry } from "../../../utils/logEntry"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateMonthRanking = async () => {
    logEntry({
        severrity: `INFO`,
        message: `start updateMonthRanking`
    })
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`month`, 30)
    await updateEachPeriodsRanking.run()
}
