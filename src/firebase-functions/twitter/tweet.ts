import Twitter from "twitter-api-v2"

import { ClipRepository } from "../../repositories/clip"
import { getJSTDate } from "../../utils/formatTime"
import { logEntry } from "../../utils/logEntry"

export async function tweetTopClip() {
    logEntry({
        severity: `INFO`,
        message: `start tweet`
    })
    //get summary clip
    const clipRepository = new ClipRepository()
    const clipDoc = await clipRepository.getClip(`summary`)

    //get daily top clip
    const clips = clipDoc.clipsMap.get(`day`)
    if (clips == undefined) {
        logEntry({
            severity: `ERROR`,
            message: `day clips is undefined`
        })
        return
    }
    const topClip = clips[0]
    
    //create tweet
    const rankingDate = getJSTDate()
    const tweet = `${
        rankingDate.getMonth() + 1
    }/${rankingDate.getDate()}に最も再生されたクリップ\n\n${topClip.broadcaster_name} - ${
        topClip.title
    }\n\n${topClip.url}\n\nクリップをもっと見る\n https://www.twitchclipsranking.com/`

    //tweet
    const client = new Twitter({
        appKey: process.env.TWITTER_API_KEY as string,
        appSecret: process.env.TWITTER_API_SECRET as string,
        accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET as string
    })

    await client.v2.tweet(tweet).catch((error) => {
        logEntry({
            severity: `ERROR`,
            message: `tweet failed: ${error}`
        })
        return
    })
}
