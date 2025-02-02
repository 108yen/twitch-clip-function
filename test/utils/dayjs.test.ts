import dayjs from "../../src/utils/dayjs"

describe("dayjsのテスト", () => {
  test("localeの確認", () => {
    const day = dayjs()
    expect(day.locale()).toEqual("ja")
  })
  test("時間の確認", () => {
    //dateで計算
    const date = new Date()
    const JSThour =
      date.getHours() + 9 > 23 ? date.getHours() - 15 : date.getHours() + 9

    const day = dayjs()
    expect(day.tz().hour()).toEqual(JSThour)
  })
})
