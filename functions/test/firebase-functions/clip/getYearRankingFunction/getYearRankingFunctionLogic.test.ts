import axios from "axios";
import { GetYearRankingFunctionLogic } from '../../../../src/firebase-functions/clip/getYearRankingFunction/getYearRankingFunctionLogic';
import { TwitchClipApi } from '../../../../src/apis/clip';
import { Clip } from '../../../../src/models/clip';
import { ClipDoc } from '../../../../src/models/clipDoc';
import { Streamer } from '../../../../src/models/streamer';
import { ClipRepository } from '../../../../src/repositories/clip';
import { StreamerRepository } from '../../../../src/repositories/streamer';
import fs from "fs";

jest.mock(`axios`);

describe(`GetYearRankingFunctionLogicのテスト`, () => {
    let getYearRankingFunctionLogic: GetYearRankingFunctionLogic;
    beforeAll(async () => {
        (axios as any).mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`,
            }
        });
        getYearRankingFunctionLogic = await GetYearRankingFunctionLogic.init();
    })
    afterEach(() => jest.restoreAllMocks())
    test(`getStreamersのテスト`, async () => {
        const getStreamersSpy = jest
            .spyOn(StreamerRepository.prototype, `getStreamers`)
            .mockResolvedValue([
                new Streamer({
                    id: `49207184`,
                    follower_num: 100,
                }),
                new Streamer({
                    id: `545050196`,
                    follower_num: 200,
                })
            ]);

        const streamers = await getYearRankingFunctionLogic.getStreamers();

        expect(getStreamersSpy).toHaveBeenCalled();
        expect(streamers).toEqual([
            new Streamer({
                id: `49207184`,
                follower_num: 100,
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 200,
            })
        ]);
    }, 100000)
    test(`getStreamersのテスト:firestoreエラー`, async () => {
        const getStreamersSpy = jest
            .spyOn(StreamerRepository.prototype, `getStreamers`)
            .mockRejectedValueOnce(new Error(`firestore error test`));

        await expect(getYearRankingFunctionLogic.getStreamers())
            .rejects.toThrowError();
        expect(getStreamersSpy).toHaveBeenCalled();
    }, 100000)
    test(`getClipForEeachStreamersのテスト`, async () => {
        const getClipsSpy = jest
            .spyOn(TwitchClipApi.prototype, `getClips`)
            .mockImplementation(
                async (
                    broadcaster_id: number,
                    started_at?: Date,
                    _ended_at?: Date,
                ) => {
                    const jsonObj = JSON.parse(fs.readFileSync(`data/clipDoc/${broadcaster_id}.json`, `utf-8`));
                    const result = new ClipDoc();
                    for (const i in jsonObj) {
                        const clips: Array<Clip> = [];
                        for (const j in jsonObj[i]) {
                            const element = jsonObj[i][j] as Clip;
                            clips.push(element);
                        }
                        //シャッフル
                        // clips.sort((a, b) => 0.5 - Math.random());
                        result.clipsMap.set(
                            i,
                            clips
                        )
                    }
                    return result.clipsMap.get(`${started_at!.getFullYear()}`)!;
                }
            );
        const updateClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `updateClip`)
            .mockImplementation();
        // const commitBatchSpy = jest
        //     .spyOn(BatchRepository.prototype, `commitBatch`)
        //     .mockResolvedValue();

        const streamer = [
            new Streamer({
                id: `49207184`,
                display_name: `fps_shaka`,
                created_at: `2013-09-19T13:21:29Z`,
                follower_num: 100,
            }),
            new Streamer({
                id: `545050196`,
                display_name: `加藤純一です`,
                created_at: `2020-06-18T04:04:09Z`,
                follower_num: 200,
            })
        ];

        await getYearRankingFunctionLogic.getClipForEeachStreamers(streamer);

        //呼び出し回数チェック
        const currentYear = new Date().getFullYear();
        const expectCallGetClips = (currentYear - 2016) + (currentYear - 2020);
        expect(getClipsSpy).toHaveBeenCalledTimes(expectCallGetClips);
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3);
        // expect(commitBatchSpy).toHaveBeenCalledTimes(1);

        //中身のデータチェック
        for (const key in updateClipDocSpy.mock.calls) {
            if (Object.prototype.hasOwnProperty.call(updateClipDocSpy.mock.calls, key)) {
                const args = updateClipDocSpy.mock.calls[key];
                // !debug summaryのモックデータ作成
                // if (args[0] == `past_summary`) {
                //     console.debug(`summary called`);

                //     //順番チェック
                //     for (const [_, clips] of args[1].clipsMap) {

                //         for (let index = 0; index < clips.length - 1; index++) {
                //             expect(clips[index].view_count!).toBeGreaterThanOrEqual(clips[index + 1].view_count!);
                //         }

                //     }

                //     const json = JSON.stringify(Object.fromEntries(args[1].clipsMap.entries()));
                //     fs.writeFileSync(`data/clipDoc/past_summary.json`, json);
                //     break;
                // }

                const jsonObj = JSON.parse(fs.readFileSync(`data/clipDoc/${args[0]}.json`, `utf-8`));
                const result = new ClipDoc();
                const removePeriods = [`day`, `week`, `month`, `year`, `all`];
                for (const i in jsonObj) {
                    if (removePeriods.includes(i)) {
                        break;
                    }
                    const clips: Array<Clip> = [];
                    for (const j in jsonObj[i]) {
                        const clip = jsonObj[i][j] as Clip;
                        clips.push(clip);
                    }
                    result.clipsMap.set(
                        i,
                        clips
                    )
                }
                //順番チェック
                for (const [_, clips] of args[1].clipsMap) {
                    for (let index = 0; index < clips.length - 1; index++) {
                        expect(clips[index].view_count!).toBeGreaterThanOrEqual(clips[index + 1].view_count!);
                    }
                }

                expect(args[1]).toEqual(result);
            }
        }
    }, 100000)
})