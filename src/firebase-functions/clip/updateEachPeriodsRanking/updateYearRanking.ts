import { UpdateEachPeriodsRankingLogic } from "./logic/updateEachPeriodsRankingLogic"

export const updateYearRanking = async () => {
    const updateEachPeriodsRanking = await UpdateEachPeriodsRankingLogic.init(`year`, 365)
    await updateEachPeriodsRanking.run()
}
