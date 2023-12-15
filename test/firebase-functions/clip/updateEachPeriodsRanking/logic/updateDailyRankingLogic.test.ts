import { UpdateDailyRankingLogic } from "../../../../../src/firebase-functions/clip/updateEachPeriodsRanking/logic/updateDailyRankingLogic"
import { Clip } from "../../../../../src/models/clip"
import { ClipDoc } from "../../../../../src/models/clipDoc"
import { ClipRepository } from "../../../../../src/repositories/clip"
import { clipElementCheck, clipOrderCheck } from "../../checkFunctions"
import { createClipsData, createDailyDammyData, getJSTDate } from "../../spy"

describe(`UpdateDailyRankingLogicのテスト`, () => {
    let todayClips: Array<Clip>
    beforeAll(() => {
        const today = getJSTDate()
        const lastDay = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        todayClips = createClipsData(undefined, lastDay, today)
    })
    afterEach(() => jest.restoreAllMocks())
    test(`ダミーデータがちゃんと作成出来ているかの確認`, async () => {
        const clipDoc = await createDailyDammyData(1)
        for (const [, clips] of clipDoc.clipsMap) {
            clipOrderCheck(clips)
            clipElementCheck(clips)
        }
    })
    test(`0じの実行だった場合、clipDocを受け取ってdayランキングだけ出す`, async () => {
        const todayClipDoc = new ClipDoc({ clipsMap: new Map([[`day`, todayClips]]) })

        const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
        const clips = updateDailyRankingLogic[`extractDayClips`](todayClipDoc)

        expect(clips).toEqual(todayClips)
    })
    test(`firestoreの今のdayランキングをとって入れなおす`, async () => {
        const getClipsSpy = jest
            .spyOn(ClipRepository.prototype, `getClip`)
            .mockImplementation(() => createDailyDammyData(1))
        const setClipSpy = jest
            .spyOn(ClipRepository.prototype, `setClip`)
            .mockImplementation()

        const todayClipDoc = new ClipDoc({
            clipsMap: new Map([[`day`, todayClips]])
        })

        const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
        await expect(updateDailyRankingLogic[`update`]()).resolves.not.toThrowError()

        expect(getClipsSpy).toHaveBeenCalledTimes(1)
        expect(setClipSpy).toHaveBeenCalledTimes(1)
        expect(setClipSpy.mock.calls[0][0]).toEqual(`daily`)
        const today = getJSTDate()
        const expectedKeys = [...Array(7).keys()].map((index) => {
            const started_at = new Date(
                today.getTime() - (index + 1) * 24 * 60 * 60 * 1000
            )
            return `${started_at.getMonth() + 1}/${started_at.getDate()}`
        })
        expect(Array.from(setClipSpy.mock.calls[0][1].clipsMap.keys()).sort()).toEqual(
            expectedKeys.sort()
        )
        for (const [, clips] of setClipSpy.mock.calls[0][1].clipsMap) {
            clipOrderCheck(clips)
            clipElementCheck(clips)
        }
    })
    test(`2回目の更新はされないことのチェック`, async () => {
        const getClipsSpy = jest
            .spyOn(ClipRepository.prototype, `getClip`)
            .mockImplementation(() => createDailyDammyData(0))
        const setClipSpy = jest
            .spyOn(ClipRepository.prototype, `setClip`)
            .mockImplementation()

        const todayClipDoc = new ClipDoc({
            clipsMap: new Map([[`day`, todayClips]])
        })

        const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
        await expect(updateDailyRankingLogic[`update`]()).resolves.not.toThrowError()

        expect(getClipsSpy).toHaveBeenCalledTimes(1)
        expect(setClipSpy).not.toHaveBeenCalled()
    })
    test(`compareDatesのテスト`, () => {
        const todayClipDoc = new ClipDoc({
            clipsMap: new Map([[`day`, todayClips]])
        })

        const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)

        expect(updateDailyRankingLogic[`compareDates`](`10/10`, `10/9`)).toEqual(1)
        expect(updateDailyRankingLogic[`compareDates`](`10/9`, `10/10`)).toEqual(-1)
        expect(updateDailyRankingLogic[`compareDates`](`10/9`, `9/10`)).toEqual(1)
        expect(updateDailyRankingLogic[`compareDates`](`9/9`, `10/10`)).toEqual(-1)
    })
})
