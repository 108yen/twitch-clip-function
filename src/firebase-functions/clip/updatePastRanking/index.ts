import { UpdatePastRankingLogic } from "./updatePastRankingLogic"

//get twitch clip ranking for each year
export const updatePastRanking = async () => {
    const updatePastRankingLogic = await UpdatePastRankingLogic.init()

    await updatePastRankingLogic.deleteOverLimitYear()
    await updatePastRankingLogic.run()
}
