import dayjs, { locale, extend } from "dayjs"
import ja from "dayjs/locale/ja"
import duration from "dayjs/plugin/duration"

locale(ja)
extend(duration)

export default dayjs
