import { describe } from "node:test"
import { updateDayRanking } from "../../../../src"
import { testOnePeriodFunction } from "./testOnePeriodFunction"

describe(`updateDayRankingのテスト`, () => {
    test(`更新`, async () => {
        await testOnePeriodFunction(updateDayRanking, "day")
    }, 300000)
})
