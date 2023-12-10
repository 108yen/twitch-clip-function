export class Stream {
    id?: string // "40952121085",
    user_id?: string // "101051819",
    user_login?: string // "afro",
    user_name?: string // "Afro",
    game_id?: string // "32982",
    game_name?: string // "Grand Theft Auto V",
    type?: string // "live",
    title?: string // "Jacob: Digital Den Laptops & Routers | NoPixel | !MAINGEAR !FCF",
    tags?: Array<string> // ["English"],
    viewer_count?: number // 1490,
    started_at?: string // "2021-03-10T03:18:11Z",
    language?: string // "en",
    thumbnail_url?: string // "https://static-cdn.jtvnw.net/previews-ttv/live_user_afro-{width}x{height}.jpg",
    tag_ids?: Array<string> // [],
    is_mature?: boolean // false

    constructor(partial?: Partial<Stream>) {
        Object.assign(this, partial)
    }
}
