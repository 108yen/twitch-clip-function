export class Streamer {
    id = ``
    login?: string
    display_name?: string
    type?: string
    broadcaster_type?: string
    description?: string
    profile_image_url?: string
    offline_image_url?: string
    view_count?: number
    created_at?: string
    follower_num?: number

    constructor(partial?: Partial<Streamer>) {
        Object.assign(this, partial)
    }
}
