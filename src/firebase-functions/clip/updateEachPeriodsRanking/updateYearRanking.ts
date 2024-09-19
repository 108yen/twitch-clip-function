import { logEntry } from "../../../utils/logEntry"

import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateYearRanking = async () => {
    logEntry({
        severity: `INFO`,
        message: `start updateYearRanking`
    })

    try {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(
            `year`,
            365
        )
        await updateEachPeriodsRanking.run()
    } catch (error) {
        logEntry({
            severity: `ERROR`,
            message: `Failed update year ranking: \n${error}`
        })
    }
}
