import dayjs from 'dayjs'
import "dayjs/locale/ja"
import duration from "dayjs/plugin/duration"
import timezone from 'dayjs/plugin/timezone';

dayjs.locale(`ja`)
dayjs.extend(duration)
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

export default dayjs
