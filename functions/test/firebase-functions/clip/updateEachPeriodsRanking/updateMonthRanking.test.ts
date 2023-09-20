import { describe } from "node:test"
import { updateMonthRanking } from "../../../../src"
import { testOnePeriodFunction } from "./testOnePeriodFunction"

describe(`updateMonthRankingのテスト`, () => {
    test(`更新`, async () => {
        await testOnePeriodFunction(updateMonthRanking, "month")
    }, 300000)
})
