import dayjs from 'dayjs'
import "dayjs/locale/ja"
import duration from "dayjs/plugin/duration"
import timezone from 'dayjs/plugin/timezone';

describe(`dayjsのテスト`, () => {
    beforeAll(() => {
        dayjs.locale(`ja`)
        dayjs.extend(duration)
        dayjs.extend(timezone)
        dayjs.tz.setDefault(`Asia/Tokyo`)
    })
    test(`localeの確認`, () => {
        const day = dayjs()
        expect(day.locale()).toEqual(`ja`)
    })
    test(`時間の確認`, () => {
        //dateで計算
        const date = new Date()
        const JSThour = date.getHours() + 9 > 23 ? date.getHours() - 15 : date.getHours() + 9;

        const day = dayjs()
        expect(day.tz().hour()).toEqual(JSThour)
    })
})
