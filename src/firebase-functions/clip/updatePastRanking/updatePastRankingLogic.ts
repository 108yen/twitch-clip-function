import assert from "assert"
import { Streamer } from "../../../models/streamer"
import dayjs from "../../../utils/dayjs"
import { ClipFunction } from "../clipFunction"

type Periods = Record<
  string,
  { ended_at?: dayjs.Dayjs; started_at?: dayjs.Dayjs }
>

export class UpdatePastRankingLogic extends ClipFunction {
  private past_limit = 5 //max 5 years ago

  public static async init() {
    const twitchClipApi = await this.getTwitchClipApi()
    return new UpdatePastRankingLogic(twitchClipApi, "past_summary")
  }

  //5年以上前のランキングの削除処理を別で入れる
  private async deleteFieldVal(clipId: string, key: string) {
    this.clipRepository.batchDeleteFieldValue(
      clipId,
      key,
      await this.batchRepository.getBatch(),
    )
  }

  async deleteOverLimitYear() {
    const streamers = await this.getStreamers()
    const current_year = dayjs().tz().year()
    const limit_year = current_year - this.past_limit

    //each streamer
    for (const streamer of streamers) {
      assert(
        typeof streamer.created_at === "string",
        new Error(
          `GetYearRankingFunctionLogic/getClipDoc: ${streamer.display_name}: created_at is not string`,
        ),
      )
      const created_at = new Date(streamer.created_at)
      if (created_at.getFullYear() < limit_year) {
        for (let year = created_at.getFullYear(); year < limit_year; year++) {
          await this.deleteFieldVal(streamer.id, year.toString())
        }
      }
    }

    //past_summary
    const past_summary = await this.clipRepository.getClip("past_summary")
    for (let year = limit_year - 1; year > 2015; year--) {
      const clips = past_summary.clipsMap.get(year.toString())
      if (clips == undefined) break

      await this.deleteFieldVal("past_summary", year.toString())
    }

    await this.batchRepository.commitBatch()
  }

  getPeriods(streamer: Streamer): Periods {
    assert(
      typeof streamer.created_at === "string",
      new Error(
        `GetYearRankingFunctionLogic/getClipDoc: ${streamer.display_name}: created_at is not string`,
      ),
    )

    const created_at = dayjs(streamer.created_at)
    const periods: Periods = {}

    const current_year = dayjs().tz().year()

    if (created_at.tz().year() == current_year) {
      console.info(`${streamer.display_name}: account created at this year`)
      return periods
    }

    const start_year =
      created_at.tz().year() < current_year - this.past_limit
        ? current_year - this.past_limit
        : created_at.tz().year()

    for (let year = start_year; year < current_year; year++) {
      const started_at = dayjs()
        .set("year", year)
        .set("month", 5)
        .tz()
        .startOf("year")
      const ended_at = dayjs()
        .set("year", year)
        .set("month", 5)
        .tz()
        .endOf("year")

      periods[`${year}`] = { ended_at, started_at }
    }

    return periods
  }
}
