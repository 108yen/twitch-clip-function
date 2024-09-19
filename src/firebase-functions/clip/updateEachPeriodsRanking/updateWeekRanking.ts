import { logEntry } from "../../../utils/logEntry"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateWeekRanking = async () => {
    logEntry({
        severity: `INFO`,
        message: `start updateWeekRanking`
    })

    try {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`week`, 7)
        await updateEachPeriodsRanking.run()
    } catch (error) {
        logEntry({
            severity: `ERROR`,
            message: `Failed update week ranking: \n${error}`
        })
    }
}
