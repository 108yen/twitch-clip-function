import Twitter from "twitter-api-v2"
import { ClipRepository } from "../../repositories/clip"
import dayjs from "../../utils/dayjs"
import { logEntry } from "../../utils/logEntry"

async function tweet(message: string) {
  const client = new Twitter({
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET as string,
    accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
    appKey: process.env.TWITTER_API_KEY as string,
    appSecret: process.env.TWITTER_API_SECRET as string,
  })

  try {
    await client.v2.tweet(message)
  } catch (error) {
    logEntry({
      message: `tweet failed: \n${error}`,
      severity: "ERROR",
    })

    return
  }
}

export async function tweetTopClip() {
  logEntry({
    message: "start tweet",
    severity: "INFO",
  })

  const clipRepository = new ClipRepository()
  const clipDoc = await clipRepository.getClip("summary")

  // tweet day ranking
  const clips = clipDoc.clipsMap.get("day")
  if (clips == undefined) {
    logEntry({
      message: "day clips is undefined",
      severity: "ERROR",
    })
    return
  }
  const topClip = clips[0]

  const rankingDate = dayjs().subtract(1, "day").tz().format("MM/DD")
  const message = `${rankingDate}に最も再生されたクリップ\n\n${topClip.broadcaster_name} - ${topClip.title}\n\nクリップをもっと見る\nhttps://www.twitchclipsranking.com/daily\n\n${topClip.url}`

  await tweet(message)

  // tweet year ranking
  const now = dayjs()
  if (now.tz().month() == 0 && now.tz().date() == 1) {
    const clips = clipDoc.clipsMap.get("year")
    if (clips == undefined) {
      logEntry({
        message: "year clips is undefined",
        severity: "ERROR",
      })
      return
    }
    const topClip = clips[0]

    const rankingDate = dayjs().subtract(1, "day").tz().format("YYYY")
    const message = `${rankingDate}年に最も再生されたクリップ\n\n${topClip.broadcaster_name} - ${topClip.title}\n\nクリップをもっと見る\nhttps://www.twitchclipsranking.com/past\n\n${topClip.url}`

    await tweet(message)
  }
}
