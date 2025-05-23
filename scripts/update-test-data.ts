import fs from "fs"
import { Clip } from "../src/models/clip"
import { Streamer } from "../src/models/streamer"

function addTeams(streamers: Streamer[], clipsObj: Record<string, Clip[]>) {
  const result: Record<string, Clip[]> = {}

  for (const key in clipsObj) {
    if (Object.prototype.hasOwnProperty.call(clipsObj, key)) {
      const clips = clipsObj[key]

      result[key] = clips.map((clip) => {
        const streamer = streamers.find(({ id }) => id == clip.broadcaster_id)

        return {
          ...clip,
          teams:
            streamer?.teams?.map(({ display_name, name }) => ({
              display_name,
              name,
            })) ?? [],
        }
      })
    }
  }

  return result
}

/**
 * clip配下のテストデータにteamsの情報を追加するスクリプト
 */
async function main() {
  const files = ["49207184", "545050196", "past_summary", "summary"]

  const streamers: Streamer[] = JSON.parse(
    fs.readFileSync("test/test_data/clip/streamer.json", "utf-8"),
  )

  for (const name of files) {
    const path = `test/test_data/clip/oldClipDoc/${name}.json`

    const clipsObj: Record<string, Clip[]> = JSON.parse(
      fs.readFileSync(path, "utf-8"),
    )

    const result = addTeams(streamers, clipsObj)

    fs.writeFileSync(path, JSON.stringify(result), "utf-8")
  }
}

main()
