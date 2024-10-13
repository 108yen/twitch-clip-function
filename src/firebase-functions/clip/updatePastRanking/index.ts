import { logEntry } from "../../../utils/logEntry"
import { UpdatePastRankingLogic } from "./updatePastRankingLogic"

//get twitch clip ranking for each year
export const updatePastRanking = async () => {
    logEntry({
        message: `start update past ranking`,
        severity: `INFO`
    })
    try {
        const updatePastRankingLogic = await UpdatePastRankingLogic.init()

        await updatePastRankingLogic.deleteOverLimitYear()
        await updatePastRankingLogic.run()
    } catch (error) {
        logEntry({
            message: `Failed update past ranking: \n${error}`,
            severity: `ERROR`
        })
    }
}
