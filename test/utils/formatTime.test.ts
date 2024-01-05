import { getJSTDate, getJSTHours } from "../../src/utils/formatTime"

describe(`formatTimeのてすと`, () => {
    test(`getJSTDateのテスト`, () => {
        const resultDate = getJSTDate()

        //確認用のDate
        const confirmDate = setJSTDateInUTCDate(new Date())

        //millisecondsはずれるので無理やり0に設定 秒まで設定したほうが安全かも（際限ないかも）
        expect(resultDate.setMilliseconds(0)).toEqual(confirmDate.setMilliseconds(0))
    })
    test(`getJSTDateの出力フォーマット確認`, () => {
        const resultDate = getJSTDate()

        expect(resultDate.toISOString()).toMatch(
            /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-4]):([0-5][0-9]):([0-5][0-9]).(\d{3})Z/
        )
    })

    test(`getJSTHoursのテスト`, () => {
        const resultHour = getJSTHours()

        //確認用のDate
        const confirmDate = setJSTDateInUTCDate(new Date())

        expect(resultHour).toEqual(confirmDate.getUTCHours())
    })
})

function setJSTDateInUTCDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: `Asia/Tokyo`,
        year: `numeric`,
        month: `2-digit`,
        day: `2-digit`,
        hour: `2-digit`,
        minute: `2-digit`,
        second: `2-digit`
    }

    const formattedDate = new Intl.DateTimeFormat(`ja-JP`, options).format(date)

    //utcに無理やりJST時間をセットする
    return new Date(Date.parse(`${formattedDate}Z`))
}
