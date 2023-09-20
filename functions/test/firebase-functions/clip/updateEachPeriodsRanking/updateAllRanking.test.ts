import { describe } from "node:test"
import { updateAllRanking } from "../../../../src"
import { testOnePeriodFunction } from "./testOnePeriodFunction"

describe(`updateAllRankingのテスト`, () => {
    test(`更新`, async () => {
        await testOnePeriodFunction(updateAllRanking, "all")
    }, 300000)
})
