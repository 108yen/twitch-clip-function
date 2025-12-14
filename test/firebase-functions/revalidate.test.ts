import axios from "axios"
import crypto from "crypto"
import {
  afterEach,
  describe,
  expect,
  Mock,
  MockedFunction,
  test,
  vi,
} from "vitest"
import { revalidate } from "../../src/firebase-functions/"
import { logEntry } from "../../src/utils/logEntry"

vi.mock("axios")
vi.mock("../../src/utils/logEntry")

describe("revalidate", () => {
  const paths = ["/test1", "/test2"]
  const mockLogEntry = logEntry as Mock
  const mockAxios = axios as unknown as MockedFunction<typeof axios>
  const envBackup = process.env.TWITCH_CLIP_FUNCTION_SIGNATURE

  beforeEach(() => {
    process.env.TWITCH_CLIP_FUNCTION_SIGNATURE = "test-secret"
  })

  afterEach(() => {
    vi.clearAllMocks()
    process.env.TWITCH_CLIP_FUNCTION_SIGNATURE = envBackup
  })

  test("正常系: ステータス200", async () => {
    mockAxios.mockResolvedValue({ status: 200, statusText: "OK" })

    await revalidate({ paths })

    expect(mockLogEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("start revalidate page cache"),
      }),
    )
    expect(mockLogEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Revalidation success"),
      }),
    )
    expect(mockAxios).toHaveBeenCalled()
  })

  test("異常系: ステータス200以外", async () => {
    mockAxios.mockResolvedValue({
      status: 500,
      statusText: "Internal Server Error",
    })

    await revalidate({ paths })

    expect(mockLogEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Failed revalidation"),
      }),
    )
  })

  test("異常系: axios例外", async () => {
    mockAxios.mockRejectedValue(new Error("network error"))

    await revalidate({ paths })

    expect(mockLogEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Failed revalidate page cache"),
      }),
    )
  })

  test("generateSignatureの計算が正しい", async () => {
    const data = { paths }
    const dataString = JSON.stringify(data)
    const expectedSignature = crypto
      .createHmac("sha256", "test-secret")
      .update(dataString)
      .digest("hex")

    await revalidate({ paths })

    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-twitch-clip-function-signature": expectedSignature,
        }),
      }),
    )
  })
})
