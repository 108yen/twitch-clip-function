import { streamersDocRef } from "../../src/firestore-refs/streamerRefs"
import { Streamer } from "../../src/models/streamer"
import { StreamerRepository } from "../../src/repositories/streamer"

const mockStreamers: Streamer[] = [
  new Streamer({ display_name: "Streamer1", id: "123" }),
  new Streamer({ display_name: "Streamer2", id: "456" }),
]

jest.mock("../../src/firestore-refs/streamerRefs", () => {
  const mockedDocRef = {
    get: jest.fn().mockResolvedValue({
      data: jest.fn().mockReturnValue({ streamers: [] }),
    }),
    set: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  }

  return {
    streamersDocRef: mockedDocRef,
  }
})

describe("StreamerRepository", () => {
  let repository: StreamerRepository

  beforeEach(() => {
    repository = new StreamerRepository()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("getStreamers", () => {
    test("正常系: ストリーマー一覧を取得できる", async () => {
      const mockData = { streamers: mockStreamers }
      ;(streamersDocRef.get as jest.Mock).mockResolvedValue({
        data: jest.fn().mockReturnValue(mockData),
      })

      const result = await repository.getStreamers()

      expect(streamersDocRef.get).toHaveBeenCalled()
      expect(result).toEqual(mockStreamers)
    })

    test("異常系: get処理でエラーが発生した場合", async () => {
      const mockError = new Error("get error")
      ;(streamersDocRef.get as jest.Mock).mockRejectedValue(mockError)

      const consoleSpy = jest.spyOn(console, "error").mockImplementation()

      await expect(repository.getStreamers()).rejects.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "StreamerRepository/getStreamers/streamersDocRef.get():",
        ),
      )

      consoleSpy.mockRestore()
    })

    test("異常系: データが存在しない場合", async () => {
      ;(streamersDocRef.get as jest.Mock).mockResolvedValue({
        data: jest.fn().mockReturnValue({ streamers: undefined }),
      })

      await expect(repository.getStreamers()).rejects.toThrow(
        "StreamerRepository/getStreamers: ds.data() is undefined",
      )
    })
  })

  describe("addStreamers", () => {
    test("正常系: ストリーマーを追加できる", async () => {
      await repository.addStreamers(mockStreamers)

      expect(streamersDocRef.update).toHaveBeenCalledWith({
        streamers: expect.anything(),
      })
    })

    test("異常系: update処理でエラーが発生した場合", async () => {
      const mockError = new Error("update error")
      ;(streamersDocRef.update as jest.Mock).mockRejectedValue(mockError)

      const consoleSpy = jest.spyOn(console, "error").mockImplementation()

      await expect(repository.addStreamers(mockStreamers)).rejects.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "StreamerRepository/addStreamers/streamersDocRef.update():",
        ),
      )

      consoleSpy.mockRestore()
    })
  })

  describe("updateStreamers", () => {
    test("正常系: ストリーマーリストを更新できる", async () => {
      await repository.updateStreamers(mockStreamers)

      expect(streamersDocRef.set).toHaveBeenCalledWith(
        { streamers: mockStreamers },
        { merge: true },
      )
    })

    test("異常系: set処理でエラーが発生した場合", async () => {
      const mockError = new Error("set error")
      ;(streamersDocRef.set as jest.Mock).mockRejectedValue(mockError)

      const consoleSpy = jest.spyOn(console, "error").mockImplementation()

      await expect(repository.updateStreamers(mockStreamers)).rejects.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "StreamerRepository/updateStreamers/streamersDocRef.set():",
        ),
      )

      consoleSpy.mockRestore()
    })
  })

  describe("batchUpdateStreamers", () => {
    test("バッチでストリーマーリストを更新できる", () => {
      const mockBatch = { set: jest.fn() }

      repository.batchUpdateStreamers(mockStreamers, mockBatch as any)

      expect(mockBatch.set).toHaveBeenCalledWith(
        streamersDocRef,
        { streamers: mockStreamers },
        { merge: true },
      )
    })
  })
})
