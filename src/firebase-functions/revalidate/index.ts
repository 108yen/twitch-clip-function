import axios, { AxiosRequestConfig } from "axios"
import crypto from "crypto"
import { logEntry } from "../../utils/logEntry"

function generateSignature(data: string) {
  return crypto
    .createHmac("sha256", process.env.TWITCH_CLIP_FUNCTION_SIGNATURE as string)
    .update(data)
    .digest("hex")
}

interface revalidateProps {
  paths: string[]
}

export async function revalidate({ paths }: revalidateProps) {
  logEntry({
    message: "start revalidate page cache",
    severity: "INFO",
  })

  try {
    const data = { paths }
    const signature = generateSignature(JSON.stringify(data))

    const config: AxiosRequestConfig = {
      data,
      headers: {
        ["Content-Type"]: "application/json",
        ["x-twitch-clip-function-signature"]: signature,
      },
      method: "POST",
      url: "https://www.twitchclipsranking.com/api/revalidate",
    }

    const res = await axios(config)

    if (res.status === 200) {
      logEntry({
        message: "Revalidation success",
        severity: "INFO",
      })
    } else {
      logEntry({
        message: `Failed revalidation.\nError code: ${res.status}.\nError message: ${res.statusText}`,
        severity: "ERROR",
      })
    }
  } catch (error) {
    logEntry({
      message: `Failed revalidate page cache: \n${error}`,
      severity: "ERROR",
    })
  }
}
