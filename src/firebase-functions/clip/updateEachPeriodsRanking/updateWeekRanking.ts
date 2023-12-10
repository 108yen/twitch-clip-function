import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateWeekRanking = async () => {
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`week`, 7)
    await updateEachPeriodsRanking.run()
}
