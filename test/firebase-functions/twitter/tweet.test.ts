import Twitter from "twitter-api-v2"

import { tweetTopClip } from "../../../src/firebase-functions/twitter/tweet"
import { ClipRepository } from "../../../src/repositories/clip"
import { createSummaryClipDoc } from "../clip/spy"

jest.mock(`twitter-api-v2`)

describe(`tweetのテスト`, () => {
    let mockedTwitter: jest.Mock
    beforeAll(() => {
        mockedTwitter = Twitter as unknown as jest.Mock
    })
    afterEach(() => jest.restoreAllMocks())
    test(`tweetのテスト正常実行テスト`, async () => {
        const mockData = createSummaryClipDoc()
        const getClipSpy = jest
            .spyOn(ClipRepository.prototype, `getClip`)
            .mockResolvedValue(mockData)
        mockedTwitter.mockImplementationOnce(() => {
            return {
                v2: {
                    tweet: async () => {
                        return
                    }
                }
            }
        })

        //実行
        await expect(tweetTopClip()).resolves.not.toThrow()

        expect(getClipSpy).toHaveBeenCalledTimes(1)
    })
    test(`day clips is undefinedエラー`, async () => {
        const mockData = createSummaryClipDoc()
        mockData.clipsMap.delete(`day`)
        const getClipSpy = jest
            .spyOn(ClipRepository.prototype, `getClip`)
            .mockResolvedValue(mockData)
        mockedTwitter.mockImplementationOnce(() => {
            return {
                v2: {
                    tweet: async () => {
                        return
                    }
                }
            }
        })

        //実行
        await expect(tweetTopClip()).resolves.not.toThrow()

        expect(getClipSpy).toHaveBeenCalledTimes(1)
    })
    test(`tweet failedエラー`, async () => {
        const mockData = createSummaryClipDoc()
        const getClipSpy = jest
            .spyOn(ClipRepository.prototype, `getClip`)
            .mockResolvedValue(mockData)
        mockedTwitter.mockImplementationOnce(() => {
            return {
                v2: {
                    tweet: async () => {
                        new Error(`test error`)
                    }
                }
            }
        })

        //実行
        await expect(tweetTopClip()).resolves.not.toThrow()

        expect(getClipSpy).toHaveBeenCalledTimes(1)
    })
})
