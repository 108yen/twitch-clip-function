import { logEntry } from "../../../utils/logEntry"

import { UpdatePastRankingLogic } from "./updatePastRankingLogic"

//get twitch clip ranking for each year
export const updatePastRanking = async () => {
    logEntry({
        severity: `INFO`,
        message: `start updatePastRanking`
    })
    const updatePastRankingLogic = await UpdatePastRankingLogic.init()

    await updatePastRankingLogic.deleteOverLimitYear()
    await updatePastRankingLogic.run()
}
