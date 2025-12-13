import { afterEach, describe, expect, Mock, test, vi } from "vitest"
import { clipDocRef } from "../../src/firestore-refs/clipRefs"
import { ClipDoc } from "../../src/models/clipDoc"
import { ClipRepository } from "../../src/repositories/clip"

// モックの設定
const mockData = new ClipDoc()

vi.mock("../../src/firestore-refs/clipRefs", () => {
  const mockedDocRef = {
    delete: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({
      data: vi.fn().mockImplementation(() => mockData),
    }),
    set: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  }

  return {
    clipDocRef: vi.fn().mockReturnValue(mockedDocRef),
  }
})

describe("ClipRepository", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("バッチ操作", () => {
    test("batchCreateClipDocでclipDocRefとbatch.setが呼ばれる", () => {
      const { batchCreateClipDoc } = new ClipRepository()
      const mockBatch = { set: vi.fn() }
      const clipId = "test-clip-id"

      batchCreateClipDoc(clipId, mockBatch as any)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockBatch.set).toHaveBeenCalledWith(
        clipDocRef({ clipId }),
        expect.any(ClipDoc),
      )
    })

    test("batchDeleteClipDocでclipDocRefとbatch.deleteが呼ばれる", () => {
      const { batchDeleteClipDoc } = new ClipRepository()
      const mockBatch = { delete: vi.fn() }
      const clipId = "test-clip-id"

      batchDeleteClipDoc(clipId, mockBatch as any)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockBatch.delete).toHaveBeenCalledWith(clipDocRef({ clipId }))
    })

    test("batchDeleteFieldValueでclipDocRefとbatch.updateが呼ばれる", () => {
      const { batchDeleteFieldValue } = new ClipRepository()
      const mockBatch = { update: vi.fn() }
      const clipId = "test-clip-id"
      const key = "testKey"

      batchDeleteFieldValue(clipId, key, mockBatch as any)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockBatch.update).toHaveBeenCalledWith(
        clipDocRef({ clipId }),
        expect.objectContaining({ [key]: expect.anything() }),
      )
    })

    test("batchUpdateClipでclipDocRefとbatch.setが呼ばれる", () => {
      const { batchUpdateClip } = new ClipRepository()
      const mockBatch = { set: vi.fn() }
      const clipId = "test-clip-id"
      const clipDoc = new ClipDoc()

      batchUpdateClip(clipId, clipDoc, mockBatch as any)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockBatch.set).toHaveBeenCalledWith(
        clipDocRef({ clipId }),
        clipDoc,
        { merge: true },
      )
    })
  })

  describe("単一ドキュメント操作", () => {
    test("createClipDocが成功する場合", async () => {
      const { createClipDoc } = new ClipRepository()
      const clipId = "test-clip-id"
      const mockSet = vi.fn().mockResolvedValue({})
      ;(clipDocRef as Mock).mockReturnValue({
        set: mockSet,
      })

      await createClipDoc(clipId)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockSet).toHaveBeenCalledWith(expect.any(ClipDoc))
    })

    test("createClipDocが失敗する場合", async () => {
      const { createClipDoc } = new ClipRepository()
      const clipId = "test-clip-id"
      const mockError = new Error("mock error")
      const mockSet = vi.fn().mockRejectedValue(mockError)
      ;(clipDocRef as Mock).mockReturnValue({
        set: mockSet,
      })

      const spy = vi.spyOn(console, "error").mockImplementation(() => {
        /* do nothing */
      })

      await expect(createClipDoc(clipId)).rejects.toThrow()

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining(
          "ClipRepository/createClipDoc/clipDocRef.set():",
        ),
      )

      spy.mockRestore()
    })

    test("deleteClipDocが成功する場合", async () => {
      const { deleteClipDoc } = new ClipRepository()
      const clipId = "test-clip-id"
      const mockDelete = vi.fn().mockResolvedValue({})
      ;(clipDocRef as Mock).mockReturnValue({
        delete: mockDelete,
      })

      await deleteClipDoc(clipId)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockDelete).toHaveBeenCalled()
    })

    test("deleteClipDocが失敗する場合", async () => {
      const { deleteClipDoc } = new ClipRepository()
      const clipId = "test-clip-id"
      const mockError = new Error("mock error")
      const mockDelete = vi.fn().mockRejectedValue(mockError)
      ;(clipDocRef as Mock).mockReturnValue({
        delete: mockDelete,
      })

      const spy = vi.spyOn(console, "error").mockImplementation(() => {
        /* do nothing */
      })
      await expect(deleteClipDoc(clipId)).rejects.toThrow()

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining(
          "ClipRepository/createClipDoc/clipDocRef.delete():",
        ),
      )

      spy.mockRestore()
    })

    test("getClipが成功する場合", async () => {
      const { getClip } = new ClipRepository()
      const clipId = "test-clip-id"
      const mockClipDoc = new ClipDoc()
      const mockData = vi.fn().mockReturnValue(mockClipDoc)
      const mockGet = vi.fn().mockResolvedValue({
        data: mockData,
      })
      ;(clipDocRef as Mock).mockReturnValue({
        get: mockGet,
      })

      const result = await getClip(clipId)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockGet).toHaveBeenCalled()
      expect(mockData).toHaveBeenCalled()
      expect(result).toEqual(mockClipDoc)
    })

    test("getClipが失敗する場合", async () => {
      const { getClip } = new ClipRepository()
      const clipId = "test-clip-id"
      const mockError = new Error("mock error")
      const mockGet = vi.fn().mockRejectedValue(mockError)
      ;(clipDocRef as Mock).mockReturnValue({
        get: mockGet,
      })

      const spy = vi.spyOn(console, "error").mockImplementation(() => {
        /* do nothing */
      })

      await expect(getClip(clipId)).rejects.toThrow()

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("ClipRepository/getClip/clipDocRef.get():"),
      )

      spy.mockRestore()
    })

    test("getClipでデータが存在しない場合", async () => {
      const { getClip } = new ClipRepository()
      const clipId = "test-clip-id"
      const mockData = vi.fn().mockReturnValue(undefined)
      const mockGet = vi.fn().mockResolvedValue({
        data: mockData,
      })
      ;(clipDocRef as Mock).mockReturnValue({
        get: mockGet,
      })

      await expect(getClip(clipId)).rejects.toThrow(
        `ClipRepository/getClip/clipDocRef.get(): clipId: ${clipId}, clipDoc is undefined`,
      )
    })

    test("setClipが成功する場合", async () => {
      const { setClip } = new ClipRepository()
      const clipId = "test-clip-id"
      const clipDoc = new ClipDoc()
      const mockSet = vi.fn().mockResolvedValue({})
      ;(clipDocRef as Mock).mockReturnValue({
        set: mockSet,
      })

      await setClip(clipId, clipDoc)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockSet).toHaveBeenCalledWith(clipDoc, { merge: false })
    })

    test("setClipが失敗する場合", async () => {
      const { setClip } = new ClipRepository()
      const clipId = "test-clip-id"
      const clipDoc = new ClipDoc()
      const mockError = new Error("mock error")
      const mockSet = vi.fn().mockRejectedValue(mockError)
      ;(clipDocRef as Mock).mockReturnValue({
        set: mockSet,
      })

      const spy = vi.spyOn(console, "error").mockImplementation(() => {
        /* do nothing */
      })

      await expect(setClip(clipId, clipDoc)).rejects.toThrow()

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("ClipRepository/updateClip/clipDocRef.set():"),
      )

      spy.mockRestore()
    })

    test("updateClipが成功する場合", async () => {
      const { updateClip } = new ClipRepository()
      const clipId = "test-clip-id"
      const clipDoc = new ClipDoc()
      const mockSet = vi.fn().mockResolvedValue({})
      ;(clipDocRef as Mock).mockReturnValue({
        set: mockSet,
      })

      await updateClip(clipId, clipDoc)

      expect(clipDocRef).toHaveBeenCalledWith({ clipId })
      expect(mockSet).toHaveBeenCalledWith(clipDoc, { merge: true })
    })

    test("updateClipが失敗する場合", async () => {
      const { updateClip } = new ClipRepository()
      const clipId = "test-clip-id"
      const clipDoc = new ClipDoc()
      const mockError = new Error("mock error")
      const mockSet = vi.fn().mockRejectedValue(mockError)
      ;(clipDocRef as Mock).mockReturnValue({
        set: mockSet,
      })

      const spy = vi.spyOn(console, "error").mockImplementation(() => {
        /* do nothing */
      })

      await expect(updateClip(clipId, clipDoc)).rejects.toThrow()

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("ClipRepository/updateClip/clipDocRef.set():"),
      )

      spy.mockRestore()
    })
  })
})
