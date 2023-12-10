import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateMonthRanking = async () => {
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`month`, 30)
    await updateEachPeriodsRanking.run()
}
