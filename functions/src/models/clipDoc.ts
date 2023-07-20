import { Clip } from "./clip";

export class ClipDoc {
    CLIP_NUM = 100;

    day?: Array<Clip>;
    week?: Array<Clip>;
    month?: Array<Clip>;
    year?: Array<Clip>;

    constructor(partial?: Partial<ClipDoc>) {
        Object.assign(this, partial)
    }

    clipDocConcat(clipDoc: ClipDoc) {
        this.day = clipDoc.day?.concat(this.day ?? []) ?? this.day;
        this.week = clipDoc.week?.concat(this.week ?? []) ?? this.week;
        this.month = clipDoc.month?.concat(this.month ?? []) ?? this.month;
        this.year = clipDoc.year?.concat(this.year ?? []) ?? this.year;
    }

    sort() {
        this.sortByViewconut(this.day);
        this.sortByViewconut(this.week);
        this.sortByViewconut(this.month);
        this.sortByViewconut(this.year);
    }

    private sortByViewconut(clips?: Array<Clip>) {
        return clips
            ?.sort((a, b) => {
                if (!a.view_count) {
                    return 1;
                }
                if (!b.view_count) {
                    return -1;
                }
                return b.view_count - a.view_count;
            })
            .slice(0, this.CLIP_NUM);
    }
}