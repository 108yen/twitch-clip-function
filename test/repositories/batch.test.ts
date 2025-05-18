import { BatchRepository } from "../../src/repositories/batch"

describe("BatchRepository", () => {
  test("commitBatchでcatchが呼ばれる", async () => {
    const repo = new BatchRepository()
    repo["batch"].commit = jest.fn().mockRejectedValue(new Error("fail"))

    const spy = jest.spyOn(console, "error").mockImplementation()

    await expect(repo.commitBatch()).rejects.toThrow()

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(
        "BatchRepository/commitBatch/this.batch.commit():",
      ),
    )

    spy.mockRestore()
  })

  test("getBatchでchunkがchunkLimitを超えた場合にcommitBatchが呼ばれる", async () => {
    const commitSpy = jest
      .spyOn(BatchRepository.prototype, "commitBatch")
      .mockResolvedValue()

    const repo = new BatchRepository(1)
    for (let i = 0; i < 3; i++) {
      await repo.getBatch()
    }
    expect(commitSpy).toHaveBeenCalled()
    commitSpy.mockRestore()
  })
})
