import { describe } from "node:test"
import { updateWeekRanking } from "../../../../src"
import { testOnePeriodFunction } from "./testOnePeriodFunction"

describe(`updateWeekRankingのテスト`, () => {
    test(`更新`, async () => {
        await testOnePeriodFunction(updateWeekRanking, "week")
    }, 300000)
})
