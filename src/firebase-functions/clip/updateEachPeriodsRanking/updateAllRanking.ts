import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateAllRanking = async () => {
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`all`)
    await updateEachPeriodsRanking.run()
}
