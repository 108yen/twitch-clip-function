---
mode: "agent"
tools: ["codebase"]
---

`repositories/clip.test.ts`のテストを`repo`を定義する必要がない箇所は、以下のようにリファクタリングしてほしい。

before

```typescript
test("getClipが失敗する場合", async () => {
  const repo = new ClipRepository()
  const clipId = "test-clip-id"
  const mockError = new Error("mock error")
  const mockGet = jest.fn().mockRejectedValue(mockError)
  ;(clipDocRef as jest.Mock).mockReturnValue({
    get: mockGet,
  })

  const spy = jest.spyOn(console, "error").mockImplementation()

  await expect(repo.getClip(clipId)).rejects.toThrow()

  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining("ClipRepository/getClip/clipDocRef.get():"),
  )

  spy.mockRestore()
})
```

after

```typescript
test("getClipが失敗する場合", async () => {
  const { getClip } = new ClipRepository()
  const clipId = "test-clip-id"
  const mockError = new Error("mock error")
  const mockGet = jest.fn().mockRejectedValue(mockError)
  ;(clipDocRef as jest.Mock).mockReturnValue({
    get: mockGet,
  })

  const spy = jest.spyOn(console, "error").mockImplementation()

  await expect(getClip(clipId)).rejects.toThrow()

  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining("ClipRepository/getClip/clipDocRef.get():"),
  )

  spy.mockRestore()
})
```
