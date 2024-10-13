import { logEntry } from "../../../utils/logEntry"
import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateAllRanking = async () => {
    logEntry({
        message: `start update all ranking`,
        severity: `INFO`
    })

    try {
        const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`all`)
        await updateEachPeriodsRanking.run()
    } catch (error) {
        logEntry({
            message: `Failed update all ranking: \n${error}`,
            severity: `ERROR`
        })
    }
}
