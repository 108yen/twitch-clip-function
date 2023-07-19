import { Clip } from "./clip";

export class ClipDoc {
    day?: Array<Clip>;
    week?: Array<Clip>;
    month?: Array<Clip>;
    year?: Array<Clip>;

    constructor(partial?: Partial<ClipDoc>) {
        Object.assign(this, partial)
    }
}