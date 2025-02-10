import * as admin from "firebase-admin"

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}

import {
  revalidate,
  streamerSelection,
  tweetTopClip,
  updateAllRanking,
  updateDayRanking,
  updateMonthRanking,
  updatePastRanking,
  updateWeekRanking,
  updateYearRanking,
} from "./firebase-functions"
import dayjs from "./utils/dayjs"
import { logEntry } from "./utils/logEntry"

async function main() {
  const startedAt = dayjs()
  const hour = startedAt.tz().hour()
  const date = startedAt.tz().date()

  const revalidatePaths = []

  logEntry({
    message: `started at ${startedAt.tz().format()}`,
    severity: "INFO",
  })

  // every 6 hours
  if ([0, 6, 12, 18].includes(hour)) {
    await streamerSelection()
    revalidatePaths.push("/streamers")
  }

  // every 3 hours
  await updateDayRanking()
  revalidatePaths.push("/")

  // everyday at 0 o'clock
  if (hour == 0) {
    await updateWeekRanking()
    await updateMonthRanking()
    revalidatePaths.push("/daily")

    //tweet
    await tweetTopClip()
  }

  // every month at 1st
  if (date == 1 && hour == 0) {
    await updateYearRanking()
    await updatePastRanking()
    await updateAllRanking()
    revalidatePaths.push("/past")
  }

  // revalidate page cache
  await revalidate({ paths: revalidatePaths })

  const endedAt = dayjs()
  const executionTime = endedAt.diff(startedAt)
  const formattedDiff = dayjs
    .duration(executionTime)
    .format("HH時間 mm分 ss.SSS秒")

  logEntry({
    message: `ended at ${endedAt
      .tz()
      .format()}, execution time ${formattedDiff}`,
    severity: "INFO",
  })
}

main()
