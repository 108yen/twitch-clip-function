import { logEntry } from "../../src/utils/logEntry"

describe("logEntry", () => {
  test("should log a JSON string with message and severity", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(jest.fn())
    const params = { message: "test message", severity: "INFO" as const }

    logEntry(params)

    expect(spy).toHaveBeenCalledWith(JSON.stringify(params))

    spy.mockRestore()
  })

  test("should log with different severity levels", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(jest.fn())
    const severities = ["ALERT", "DEBUG", "ERROR", "INFO", "WARNING"] as const

    for (const severity of severities) {
      const params = { message: `msg ${severity}`, severity }

      logEntry(params)

      expect(spy).toHaveBeenCalledWith(JSON.stringify(params))
    }

    spy.mockRestore()
  })
})
