import assert from "assert"

import { Clip } from "../../../src/models/clip"

export function clipElementCheck(clips: Array<Clip>) {
  //  中身の要素確認
  for (const clip of clips) {
    expect(clip.title).toBeDefined()
    expect(clip.embed_url).toBeDefined()
    expect(clip.thumbnail_url).toBeDefined()
    expect(clip.view_count).toBeDefined()
    expect(clip.created_at).toBeDefined()
    expect(clip.creator_name).toBeDefined()
    expect(clip.broadcaster_id).toBeDefined()
    expect(clip.broadcaster_name).toBeDefined()
    expect(clip.profile_image_url).toBeDefined()
    expect(clip.broadcaster_follower_num).toBeDefined()
    expect(clip.broadcaster_login).toBeDefined()
  }
}

export function clipOrderCheck(clips: Array<Clip>) {
  //順番チェック
  for (let index = 0; index < clips.length - 1; index++) {
    const currentClipViewCount = clips[index].view_count
    const nextClipViewCount = clips[index + 1].view_count
    expect(typeof currentClipViewCount).toEqual("number")
    expect(typeof nextClipViewCount).toEqual("number")
    assert(typeof currentClipViewCount === "number")
    assert(typeof nextClipViewCount === "number")
    expect(currentClipViewCount).toBeGreaterThanOrEqual(nextClipViewCount)
  }
}
