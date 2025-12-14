import Twitter from "twitter-api-v2"
import { Mock } from "vitest"
import { tweetTopClip } from "../../../src/firebase-functions/twitter"
import { ClipRepository } from "../../../src/repositories/clip"
import { logEntry } from "../../../src/utils/logEntry"
import { createSummaryClipDoc } from "../clip/spy"

vi.mock("../../../src/utils/logEntry")

describe("tweetのテスト", () => {
  const logEntryMock = logEntry as unknown as Mock

  afterEach(() => {
    logEntryMock.mockRestore()
    vi.restoreAllMocks()
  })

  test("tweetのテスト正常実行テスト", async () => {
    const mockData = createSummaryClipDoc()
    const tweetMock = vi
      .spyOn(Twitter.prototype.v2, "tweet")
      .mockResolvedValue(Promise.resolve() as any)
    const getClipSpy = vi
      .spyOn(ClipRepository.prototype, "getClip")
      .mockResolvedValue(mockData)

    await expect(tweetTopClip()).resolves.not.toThrow()

    expect(getClipSpy).toHaveBeenCalledTimes(1)
    expect(tweetMock).toHaveBeenCalledTimes(1)
    expect(tweetMock).toHaveBeenCalledWith(
      expect.stringMatching(/\d{2}\/\d{2}に最も再生されたクリップ/),
    )
    expect(logEntryMock).toHaveBeenCalledTimes(1)
  })

  test("day clips is undefinedエラー", async () => {
    const mockData = createSummaryClipDoc()
    mockData.clipsMap.delete("day")
    const getClipSpy = vi
      .spyOn(ClipRepository.prototype, "getClip")
      .mockResolvedValue(mockData)
    const tweetMock = vi
      .spyOn(Twitter.prototype.v2, "tweet")
      .mockResolvedValue(Promise.resolve() as any)

    await expect(tweetTopClip()).resolves.not.toThrow()

    expect(getClipSpy).toHaveBeenCalledTimes(1)
    expect(tweetMock).not.toHaveBeenCalled()
    expect(logEntryMock).toHaveBeenCalledTimes(2)
  })

  test("tweet failedエラー", async () => {
    const mockData = createSummaryClipDoc()
    const getClipSpy = vi
      .spyOn(ClipRepository.prototype, "getClip")
      .mockResolvedValue(mockData)
    const tweetMock = vi
      .spyOn(Twitter.prototype.v2, "tweet")
      .mockRejectedValue(new Error("test error"))

    await expect(tweetTopClip()).resolves.not.toThrow()

    expect(getClipSpy).toHaveBeenCalledTimes(1)
    expect(tweetMock).toHaveBeenCalledTimes(1)
    expect(logEntryMock).toHaveBeenCalledTimes(2)
    expect(logEntryMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: expect.stringContaining("tweet failed"),
        severity: "ERROR",
      }),
    )
  })

  describe("年間ランキングのtweet", () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    test("1月1日に年間ランキングツイートが実行される", async () => {
      const mockData = createSummaryClipDoc()
      const getClipSpy = vi
        .spyOn(ClipRepository.prototype, "getClip")
        .mockResolvedValue(mockData)
      const mockDate = new Date(2025, 0, 1)
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)
      const tweetMock = vi
        .spyOn(Twitter.prototype.v2, "tweet")
        .mockResolvedValue(Promise.resolve() as any)

      await tweetTopClip()

      expect(getClipSpy).toHaveBeenCalledTimes(1)

      expect(tweetMock).toHaveBeenCalledTimes(2)
      expect(tweetMock).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/\d{2}\/\d{2}に最も再生されたクリップ/),
      )
      expect(tweetMock).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/\d{4}年に最も再生されたクリップ/),
      )

      expect(logEntryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "start tweet",
          severity: "INFO",
        }),
      )
    })

    test("1月1日以外では年間ランキングツイートが実行されない", async () => {
      const mockData = createSummaryClipDoc()
      const getClipSpy = vi
        .spyOn(ClipRepository.prototype, "getClip")
        .mockResolvedValue(mockData)
      const mockDate = new Date(2025, 5, 15)
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)
      const tweetMock = vi
        .spyOn(Twitter.prototype.v2, "tweet")
        .mockResolvedValue(Promise.resolve() as any)

      await tweetTopClip()

      expect(getClipSpy).toHaveBeenCalledTimes(1)
      expect(tweetMock).toHaveBeenCalledTimes(1)
      expect(tweetMock).toHaveBeenCalledWith(
        expect.stringMatching(/\d{2}\/\d{2}に最も再生されたクリップ/),
      )
    })

    test("1月1日に年間ランキングデータがない場合", async () => {
      const mockData = createSummaryClipDoc()
      mockData.clipsMap.delete("year")

      const getClipSpy = vi
        .spyOn(ClipRepository.prototype, "getClip")
        .mockResolvedValue(mockData)
      const mockDate = new Date(2025, 0, 1)
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)
      const tweetMock = vi
        .spyOn(Twitter.prototype.v2, "tweet")
        .mockResolvedValue(Promise.resolve() as any)

      await tweetTopClip()

      expect(getClipSpy).toHaveBeenCalledTimes(1)
      expect(tweetMock).toHaveBeenCalledTimes(1)
      expect(logEntryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "year clips is undefined",
          severity: "ERROR",
        }),
      )
    })
  })
})
