import { logEntry } from "../../../utils/logEntry"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateYearRanking = async () => {
    logEntry({
        severrity: `INFO`,
        message: `start updateYearRanking`
    })
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`year`, 365)
    await updateEachPeriodsRanking.run()
}
