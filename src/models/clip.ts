import { Team } from "./team"

export class Clip {
  broadcaster_follower_num?: number
  broadcaster_id?: string
  broadcaster_login?: string
  broadcaster_name?: string
  created_at?: string
  creator_id?: string
  creator_name?: string
  duration?: number
  embed_url?: string
  game_id?: string
  id?: string
  is_featured?: boolean
  language?: string
  profile_image_url?: string
  thumbnail_url?: string
  title?: string
  url?: string
  video_id?: string
  view_count?: number
  vod_offset?: number
  teams?: Team[]

  constructor(partial?: Partial<Clip>) {
    Object.assign(this, partial)
  }
}
