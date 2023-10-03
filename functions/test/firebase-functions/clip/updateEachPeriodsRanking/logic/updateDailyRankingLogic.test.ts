import { ClipRepository } from "../../../../../src/repositories/clip"

describe(`UpdateDailyRankingLogicのテスト`, () => {
    const clipRepository = new ClipRepository()
    afterEach(async () => {
        await clipRepository.deleteClipDoc(`daily`)
        jest.restoreAllMocks()
    })
    test.todo(`0じの実行だった場合、clipDocを受け取ってdayランキングだけ出す`)
    test.todo(`firestoreの今のdayランキングをとって入れなおす`)
    test.todo(`7日から漏れたやつは消す`)
})
