export class Stream {
    game_id?: string // "32982",
    game_name?: string // "Grand Theft Auto V",
    id?: string // "40952121085",
    is_mature?: boolean // false
    language?: string // "en",
    started_at?: string // "2021-03-10T03:18:11Z",
    tag_ids?: Array<string> // [],
    tags?: Array<string> // ["English"],
    thumbnail_url?: string // "https://static-cdn.jtvnw.net/previews-ttv/live_user_afro-{width}x{height}.jpg",
    title?: string // "Jacob: Digital Den Laptops & Routers | NoPixel | !FCF",
    type?: string // "live",
    user_id?: string // "101051819",
    user_login?: string // "afro",
    user_name?: string // "Afro",
    viewer_count?: number // 1490,

    constructor(partial?: Partial<Stream>) {
        Object.assign(this, partial)
    }
}
