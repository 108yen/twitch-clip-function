import { logEntry } from "../../../utils/logEntry"
import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateYearRanking = async () => {
    logEntry({
        message: `start update year ranking`,
        severity: `INFO`
    })

    try {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(
            `year`,
            365
        )
        await updateEachPeriodsRanking.run()
    } catch (error) {
        logEntry({
            message: `Failed update year ranking: \n${error}`,
            severity: `ERROR`
        })
    }
}
