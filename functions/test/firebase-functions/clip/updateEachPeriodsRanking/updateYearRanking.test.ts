import { describe } from "node:test"

import { updateYearRanking } from "../../../../src"

import { testOnePeriodFunction } from "./testOnePeriodFunction"

describe(`updateYearRankingのテスト`, () => {
    test(`更新`, async () => {
        await testOnePeriodFunction(updateYearRanking, `year`)
    }, 300000)
})
