import crypto from "crypto"

import axios, { AxiosRequestConfig } from "axios"

import { logEntry } from "../../utils/logEntry"

function generateSignature(data: string) {
    return crypto
        .createHmac(`sha256`, process.env.TWITCH_CLIP_FUNCTION_SIGNATURE as string)
        .update(data)
        .digest(`hex`)
}

export async function revalidate() {
    logEntry({
        severity: `INFO`,
        message: `start revalidate page cache`
    })

    try {
        const date = new Date().toString()
        const data = { text: date }
        const signature = generateSignature(JSON.stringify(data))

        const config: AxiosRequestConfig = {
            url: `https://www.twitchclipsranking.com/api/revalidate`,
            method: `POST`,
            headers: {
                [`Content-Type`]: `application/json`,
                [`x-twitch-clip-function-signature`]: signature
            },
            data
        }

        const res = await axios(config)

        if (res.status === 200) {
            logEntry({
                severity: `INFO`,
                message: `Revalidation success`
            })
        } else {
            logEntry({
                severity: `ERROR`,
                message: `Failed revalidation.\nError code: ${res.status}.\nError message: ${res.statusText}`
            })
        }
    } catch (error) {
        logEntry({
            severity: `ERROR`,
            message: `Failed revalidate page cache: \n${error}`
        })
    }
}
