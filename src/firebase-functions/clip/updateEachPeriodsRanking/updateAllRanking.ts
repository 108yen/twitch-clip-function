import { logEntry } from "../../../utils/logEntry"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateAllRanking = async () => {
    logEntry({
        severity: `INFO`,
        message: `start update all ranking`
    })

    try {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`all`)
        await updateEachPeriodsRanking.run()
    } catch (error) {
        logEntry({
            severity: `ERROR`,
            message: `Failed update all ranking: \n${error}`
        })
    }
}
