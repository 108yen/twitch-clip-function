import { logEntry } from "../../../utils/logEntry"

import { UpdatePastRankingLogic } from "./updatePastRankingLogic"

//get twitch clip ranking for each year
export const updatePastRanking = async () => {
    logEntry({
        severity: `INFO`,
        message: `start update past ranking`
    })
    try {
        const updatePastRankingLogic = await UpdatePastRankingLogic.init()

        await updatePastRankingLogic.deleteOverLimitYear()
        await updatePastRankingLogic.run()
    } catch (error) {
        logEntry({
            severity: `ERROR`,
            message: `Failed update past ranking: \n${error}`
        })
    }
}
