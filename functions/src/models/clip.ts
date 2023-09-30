export class Clip {
    id?: string
    url?: string
    embed_url?: string
    broadcaster_id?: string
    broadcaster_name?: string
    creator_id?: string
    creator_name?: string
    video_id?: string
    game_id?: string
    language?: string
    title?: string
    view_count?: number
    created_at?: string
    thumbnail_url?: string
    duration?: number
    vod_offset?: number
    is_featured?: boolean
    profile_image_url?: string

    constructor(partial?: Partial<Clip>) {
        Object.assign(this, partial)
    }
}
