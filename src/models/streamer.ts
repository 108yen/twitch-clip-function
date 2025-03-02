import { Team } from "./team"

export class Streamer {
  broadcaster_type?: string
  created_at?: string
  description?: string
  display_name?: string
  follower_num?: number
  id = ""
  login?: string
  offline_image_url?: string
  profile_image_url?: string
  type?: string
  view_count?: number
  teams?: Team[]

  constructor(partial?: Partial<Streamer>) {
    Object.assign(this, partial)
  }
}
