import fs from "fs"

import axios from "axios"

import { TwitchClipApi } from "../../../../src/apis/clip"
import { GetTwitchClipForAllRankingFunctionLogic } from "../../../../src/firebase-functions/clip/getTwitchClipForAllRankingFunction/getTwitchClipForAllRankingFunctionLogic"
import { Clip } from "../../../../src/models/clip"
import { ClipDoc } from "../../../../src/models/clipDoc"
import { Streamer } from "../../../../src/models/streamer"
import { BatchRepository } from "../../../../src/repositories/batch"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"

jest.mock(`axios`)

describe(`getTwitchClipForAllRankingFunctionLogicのテスト`, () => {
    let getTwitchClipForAllRankingFunctionLogic: GetTwitchClipForAllRankingFunctionLogic
    beforeAll(async () => {
        ;(axios as any).mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`
            }
        })
        getTwitchClipForAllRankingFunctionLogic =
            await GetTwitchClipForAllRankingFunctionLogic.init()
    })
    afterEach(() => jest.restoreAllMocks())
    test(`getStreamersのテスト`, async () => {
        const getStreamersSpy = jest
            .spyOn(StreamerRepository.prototype, `getStreamers`)
            .mockResolvedValue([
                new Streamer({
                    id: `49207184`,
                    follower_num: 100
                }),
                new Streamer({
                    id: `545050196`,
                    follower_num: 200
                })
            ])

        const streamers =
            await getTwitchClipForAllRankingFunctionLogic.getStreamers()

        expect(getStreamersSpy).toHaveBeenCalled()
        expect(streamers).toEqual([
            new Streamer({
                id: `49207184`,
                follower_num: 100
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 200
            })
        ])
    }, 100000)
    test(`getStreamersのテスト:firestoreエラー`, async () => {
        const getStreamersSpy = jest
            .spyOn(StreamerRepository.prototype, `getStreamers`)
            .mockRejectedValueOnce(new Error(`firestore error test`))

        await expect(
            getTwitchClipForAllRankingFunctionLogic.getStreamers()
        ).rejects.toThrowError()
        expect(getStreamersSpy).toHaveBeenCalled()
    }, 100000)
    test(`getClipForEeachStreamersのテスト`, async () => {
        const getClipsSpy = jest
            .spyOn(TwitchClipApi.prototype, `getClips`)
            .mockImplementation(async (broadcaster_id: number) => {
                const jsonObj = JSON.parse(
                    fs.readFileSync(
                        `data/clipDoc/${broadcaster_id}.json`,
                        `utf-8`
                    )
                )
                const result = new ClipDoc()
                for (const i in jsonObj) {
                    const clips: Array<Clip> = []
                    for (const j in jsonObj[i]) {
                        const element = jsonObj[i][j] as Clip
                        clips.push(element)
                    }
                    //シャッフル
                    // clips.sort((a, b) => 0.5 - Math.random());
                    result.clipsMap.set(i, clips)
                }
                return result.clipsMap.get(`all`)!
            })
        const updateClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchUpdateClip`)
            .mockImplementation()
        const commitBatchSpy = jest
            .spyOn(BatchRepository.prototype, `commitBatch`)
            .mockResolvedValue()

        const streamer = [
            new Streamer({ id: `49207184` }),
            new Streamer({ id: `545050196` })
        ]

        await getTwitchClipForAllRankingFunctionLogic.getClipForEeachStreamers(
            streamer
        )

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(2)
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)

        //中身のデータチェック
        for (const key in updateClipDocSpy.mock.calls) {
            if (
                Object.prototype.hasOwnProperty.call(
                    updateClipDocSpy.mock.calls,
                    key
                )
            ) {
                const args = updateClipDocSpy.mock.calls[key]
                // !debug summaryのモックデータ作成
                // if (args[0] == `summary`) {
                //     console.debug(`summary called`);

                //     const clipDoc = new ClipDoc();
                //     const summaryjson = JSON.parse(fs.readFileSync(`data/clipDoc/summary.json`, `utf-8`));
                //     for (const i in summaryjson) {
                //         const clips: Array<Clip> = [];
                //         for (const j in summaryjson[i]) {
                //             const element = summaryjson[i][j] as Clip;
                //             clips.push(element);
                //         }
                //         clipDoc.clipsMap.set(
                //             i,
                //             clips
                //         )
                //     }
                //     //allだけ入れ替え
                //     clipDoc.clipsMap.set(
                //         `all`,
                //         args[1].clipsMap.get(`all`)!
                //     )

                //     const json = JSON.stringify(Object.fromEntries(clipDoc.clipsMap.entries()));
                //     fs.writeFileSync(`data/clipDoc/summary.json`, json);
                //     break;
                // }

                const jsonObj = JSON.parse(
                    fs.readFileSync(`data/clipDoc/${args[0]}.json`, `utf-8`)
                )
                const result = new ClipDoc()
                const clips: Array<Clip> = []
                for (const j in jsonObj[`all`]) {
                    const clip = jsonObj[`all`][j] as Clip
                    clips.push(clip)
                }
                result.clipsMap.set(`all`, clips)

                expect(args[1]).toEqual(result)
                //順番チェック
                for (const [_, value] of args[1].clipsMap) {
                    //数は安定しない
                    expect(value.length).toEqual(100)
                    for (let index = 0; index < value.length - 1; index++) {
                        expect(value[index].view_count!).toBeGreaterThanOrEqual(
                            value[index + 1].view_count!
                        )
                    }
                }
            }
        }
    }, 100000)
    test(`getClipForEeachStreamersのテスト:axiosエラー`, async () => {
        const getClipsSpy = jest
            .spyOn(TwitchClipApi.prototype, `getClips`)
            .mockRejectedValue(new Error(`axios error test`))
        const updateClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchUpdateClip`)
            .mockImplementation()
        const commitBatchSpy = jest
            .spyOn(BatchRepository.prototype, `commitBatch`)
            .mockResolvedValue()

        const streamer = [
            new Streamer({ id: `49207184` }),
            new Streamer({ id: `545050196` })
        ]

        await expect(
            getTwitchClipForAllRankingFunctionLogic.getClipForEeachStreamers(
                streamer
            )
        ).rejects.toThrowError()

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(1)
        expect(updateClipDocSpy).not.toHaveBeenCalled()
        expect(commitBatchSpy).not.toHaveBeenCalled()
    }, 100000)
    test(`getClipForEeachStreamersのテスト:firestoreエラー`, async () => {
        const getClipsSpy = jest
            .spyOn(TwitchClipApi.prototype, `getClips`)
            .mockImplementation(async (broadcaster_id: number) => {
                const jsonObj = JSON.parse(
                    fs.readFileSync(
                        `data/clipDoc/${broadcaster_id}.json`,
                        `utf-8`
                    )
                )
                const result = new ClipDoc()
                for (const i in jsonObj) {
                    const clips: Array<Clip> = []
                    for (const j in jsonObj[i]) {
                        const element = jsonObj[i][j] as Clip
                        clips.push(element)
                    }
                    //シャッフル
                    // clips.sort((a, b) => 0.5 - Math.random());
                    result.clipsMap.set(i, clips)
                }
                return result.clipsMap.get(`all`)!
            })
        const updateClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchUpdateClip`)
            .mockImplementation()
        const commitBatchSpy = jest
            .spyOn(BatchRepository.prototype, `commitBatch`)
            .mockRejectedValue(new Error(`batch commit error test`))

        const streamer = [
            new Streamer({ id: `49207184` }),
            new Streamer({ id: `545050196` })
        ]

        await expect(
            getTwitchClipForAllRankingFunctionLogic.getClipForEeachStreamers(
                streamer
            )
        ).rejects.toThrowError()

        //呼び出し回数チェック
        expect(getClipsSpy).toHaveBeenCalledTimes(2)
        expect(updateClipDocSpy).toHaveBeenCalledTimes(3)
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    }, 100000)
})
