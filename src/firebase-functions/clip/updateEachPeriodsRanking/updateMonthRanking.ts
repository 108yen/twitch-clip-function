import { logEntry } from "../../../utils/logEntry"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateMonthRanking = async () => {
    logEntry({
        severity: `INFO`,
        message: `start update month ranking`
    })

    try {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`month`, 30)
        await updateEachPeriodsRanking.run()
    } catch (error) {
        logEntry({
            severity: `ERROR`,
            message: `Failed update month ranking: \n${error}`
        })
    }
}
