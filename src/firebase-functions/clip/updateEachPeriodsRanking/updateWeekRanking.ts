import { logEntry } from "../../../utils/logEntry"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateWeekRanking = async () => {
    logEntry({
        severrity: `INFO`,
        message: `start updateWeekRanking`
    })
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`week`, 7)
    await updateEachPeriodsRanking.run()
}
