import { TwitchClipApi } from "../../../../apis/clip"
import { Streamer } from "../../../../models/streamer"
import dayjs from "../../../../utils/dayjs"
import { ClipFunction } from "../../clipFunction"

type Periods = Record<
  string,
  { ended_at?: dayjs.Dayjs; started_at?: dayjs.Dayjs }
>

export class UpdateEachPeriodsRankingLogic extends ClipFunction {
  day?: number
  period: string

  constructor(twitchClipApi: TwitchClipApi, period: string, day?: number) {
    super(twitchClipApi, "summary")

    this.period = period
    this.day = day
  }

  public static async init(period: string, day?: number) {
    const twitchClipApi = await this.getTwitchClipApi()
    return new UpdateEachPeriodsRankingLogic(twitchClipApi, period, day)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPeriods(streamer: Streamer): Periods {
    const today = dayjs()
    let periods: Periods
    if (this.day) {
      const daysAgo = today.subtract(this.day, "day")
      periods = {
        [this.period]: { ended_at: today, started_at: daysAgo },
      }
    } else {
      periods = {
        [this.period]: {},
      }
    }
    return periods
  }
}
