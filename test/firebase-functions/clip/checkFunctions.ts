import assert from "assert"

import { Clip } from "../../../src/models/clip"

/**
 * クリップの中身のデータの存在確認
 *
 * @param clips チェック対象のクリップ
 */
export function clipElementCheck(clips: Clip[]) {
  for (const {
    broadcaster_follower_num,
    broadcaster_id,
    broadcaster_login,
    broadcaster_name,
    created_at,
    creator_name,
    embed_url,
    profile_image_url,
    teams,
    thumbnail_url,
    title,
    view_count,
  } of clips) {
    expect(title).toBeDefined()
    expect(embed_url).toBeDefined()
    expect(thumbnail_url).toBeDefined()
    expect(view_count).toBeDefined()
    expect(created_at).toBeDefined()
    expect(creator_name).toBeDefined()
    expect(broadcaster_id).toBeDefined()
    expect(broadcaster_name).toBeDefined()
    expect(profile_image_url).toBeDefined()
    expect(broadcaster_follower_num).toBeDefined()
    expect(broadcaster_login).toBeDefined()
    expect(teams).toBeDefined()

    teams?.forEach(
      ({
        background_image_url,
        banner,
        created_at,
        display_name,
        id,
        info,
        name,
        thumbnail_url,
        updated_at,
      }) => {
        expect(name).toBeDefined()
        expect(display_name).toBeDefined()

        expect(background_image_url).toBeUndefined()
        expect(banner).toBeUndefined()
        expect(created_at).toBeUndefined()
        expect(id).toBeUndefined()
        expect(info).toBeUndefined()
        expect(thumbnail_url).toBeUndefined()
        expect(updated_at).toBeUndefined()
      },
    )
  }
}

/**
 * クリップリストの順序確認
 *
 * @param clips チェック対象のクリップ
 */
export function clipOrderCheck(clips: Clip[]) {
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
