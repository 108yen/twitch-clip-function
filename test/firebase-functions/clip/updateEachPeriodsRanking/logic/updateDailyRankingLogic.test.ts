import { UpdateDailyRankingLogic } from "../../../../../src/firebase-functions/clip/updateEachPeriodsRanking/logic/updateDailyRankingLogic"
import { Clip } from "../../../../../src/models/clip"
import { ClipDoc } from "../../../../../src/models/clipDoc"
import { ClipRepository } from "../../../../../src/repositories/clip"
import dayjs from "../../../../../src/utils/dayjs"
import { clipElementCheck, clipOrderCheck } from "../../checkFunctions"
import { createClipsData, createDailyDummyData } from "../../spy"

describe("UpdateDailyRankingLogicのテスト", () => {
  let todayClips: Clip[]

  beforeAll(() => {
    const today = dayjs()
    const lastDay = dayjs().subtract(1, "day")
    todayClips = createClipsData(undefined, lastDay, today)
  })

  afterEach(() => jest.restoreAllMocks())

  test("ダミーデータがちゃんと作成出来ているかの確認", async () => {
    const clipDoc = await createDailyDummyData(1)
    for (const [, clips] of clipDoc.clipsMap) {
      clipOrderCheck(clips)
      clipElementCheck(clips)
    }
  })

  test("0じの実行だった場合、clipDocを受け取ってdayランキングだけ出す", async () => {
    const todayClipDoc = new ClipDoc({
      clipsMap: new Map([["day", todayClips]]),
    })

    const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
    const clips = updateDailyRankingLogic["extractDayClips"](todayClipDoc)

    expect(clips).toEqual(todayClips)
  })

  test("firestoreの今のdayランキングをとって入れなおす", async () => {
    const getClipsSpy = jest
      .spyOn(ClipRepository.prototype, "getClip")
      .mockImplementation(() => createDailyDummyData(1))
    const setClipSpy = jest
      .spyOn(ClipRepository.prototype, "setClip")
      .mockImplementation()

    const todayClipDoc = new ClipDoc({
      clipsMap: new Map([["day", todayClips]]),
    })

    const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
    await expect(updateDailyRankingLogic["update"]()).resolves.not.toThrow()

    expect(getClipsSpy).toHaveBeenCalledTimes(1)
    expect(setClipSpy).toHaveBeenCalledTimes(1)
    expect(setClipSpy.mock.calls[0][0]).toEqual("daily")
    const expectedKeys = [...Array(7).keys()].map((index) => {
      return dayjs()
        .subtract(index + 1, "day")
        .tz()
        .format("M/D")
    })
    expect(
      Array.from(setClipSpy.mock.calls[0][1].clipsMap.keys()).sort(),
    ).toEqual(expectedKeys.sort())
    for (const [, clips] of setClipSpy.mock.calls[0][1].clipsMap) {
      clipOrderCheck(clips)
      clipElementCheck(clips)
    }
  })

  test("2回目の更新はされないことのチェック", async () => {
    const getClipsSpy = jest
      .spyOn(ClipRepository.prototype, "getClip")
      .mockImplementation(() => createDailyDummyData(0))
    const setClipSpy = jest
      .spyOn(ClipRepository.prototype, "setClip")
      .mockImplementation()

    const todayClipDoc = new ClipDoc({
      clipsMap: new Map([["day", todayClips]]),
    })

    const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
    await expect(updateDailyRankingLogic["update"]()).resolves.not.toThrow()

    expect(getClipsSpy).toHaveBeenCalledTimes(1)
    expect(setClipSpy).not.toHaveBeenCalled()
  })

  test("compareDatesのテスト", () => {
    const todayClipDoc = new ClipDoc({
      clipsMap: new Map([["day", todayClips]]),
    })

    const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)

    expect(updateDailyRankingLogic["compareDates"]("10/10", "10/9")).toEqual(1)
    expect(updateDailyRankingLogic["compareDates"]("10/9", "10/10")).toEqual(-1)
    expect(updateDailyRankingLogic["compareDates"]("10/9", "9/10")).toEqual(1)
    expect(updateDailyRankingLogic["compareDates"]("9/9", "10/10")).toEqual(-1)
  })

  test("compareDatesのテスト:年またぎ", () => {
    const todayClipDoc = new ClipDoc({
      clipsMap: new Map([["day", todayClips]]),
    })

    const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)

    expect(updateDailyRankingLogic["compareDates"]("1/1", "12/31")).toEqual(1)
    expect(updateDailyRankingLogic["compareDates"]("12/31", "1/1")).toEqual(-1)
  })

  test("compareDatesを使ったソートのテスト", () => {
    const todayClipDoc = new ClipDoc({
      clipsMap: new Map([["day", todayClips]]),
    })

    const updateDailyRankingLogic = new UpdateDailyRankingLogic(todayClipDoc)
    const dates = [
      "12/25", //
      "12/26",
      "12/27",
      "12/28",
      "12/29",
      "12/30",
      "12/31",
      "1/1",
      "1/2",
      "1/3",
    ]
    //シャッフル
    const shuffledDates = dates.slice().sort(() => 0.5 - Math.random())
    //ソート
    const sortedDates = shuffledDates
      .slice()
      .sort(updateDailyRankingLogic["compareDates"])

    expect(sortedDates).toEqual(dates)
  })
})
