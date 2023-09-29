import assert from "assert"
import fs from "fs"
import { describe } from "node:test"

import axios from "axios"
import { WrappedScheduledFunction } from "firebase-functions-test/lib/main"

import { TwitchStreamerApi } from "../../../../src/apis/streamer"
import { streamerSelection } from "../../../../src/firebase-functions/streamer/streamerSelection"
import { Stream } from "../../../../src/models/stream"
import { Streamer } from "../../../../src/models/streamer"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"
import { testEnv } from "../../../setUp"

jest.mock(`axios`)

describe(`streamerSelectionのテスト`, () => {
    let wrappedStreamerSelection: WrappedScheduledFunction
    const mockedAxios = axios as jest.MockedFunction<typeof axios>
    beforeAll(() => {
        wrappedStreamerSelection = testEnv.wrap(streamerSelection)
    })
    beforeEach(async () => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`
            }
        })

        const oldStreamer: Array<Streamer> = JSON.parse(
            fs.readFileSync(`test/test_data/streamerSelection/oldStreamer.json`, `utf-8`)
        )
        const streamerRepository = new StreamerRepository()
        const clipRepository = new ClipRepository()
        await streamerRepository.updateStreamers(oldStreamer)
        for (const streamer of oldStreamer) {
            await clipRepository.createClipDoc(streamer.id)
        }
    })
    afterEach(async () => {
        const streamerRepository = new StreamerRepository()
        const clipRepository = new ClipRepository()
        const streamers = await streamerRepository.getStreamers()
        for (const streamer of streamers) {
            await clipRepository.deleteClipDoc(streamer.id)
        }
        await streamerRepository.updateStreamers([])
        jest.restoreAllMocks()
    })
    // test(`mock作成`, async () => {
    //     const streamerRepository = new StreamerRepository()
    //     const streamers = await streamerRepository.getStreamers()
    //     //mock作成
    //     const json = JSON.stringify(streamers)
    //     fs.writeFileSync(`test/test_data/streamerSelection/oldStreamer.json`, json)
    // })
    test(`streamerSelectionの実行テスト`, async () => {
        //準備
        const streamerRepository = new StreamerRepository()
        const clipRepository = new ClipRepository()

        const oldStreamer = await streamerRepository.getStreamers()
        const oldStreamerIds = oldStreamer.map((e) => e.id)
        //mock
        const getJpStreamsSpy = jest
            .spyOn(TwitchStreamerApi.prototype, `getJpStreams`)
            .mockImplementation(async () => {
                const streams: Array<Stream> = JSON.parse(
                    fs.readFileSync(
                        `test/test_data/streamerSelection/jpStreams.json`,
                        `utf-8`
                    )
                )
                return streams
            })
        const oldStreamrsMockData: Array<Streamer> = JSON.parse(
            fs.readFileSync(`test/test_data/streamerSelection/oldStreamer.json`, `utf-8`)
        )
        const newStreamrsMockData: Array<Streamer> = JSON.parse(
            fs.readFileSync(`test/test_data/streamerSelection/newStreamer.json`, `utf-8`)
        )
        const allStreamersMockData = newStreamrsMockData.concat(oldStreamrsMockData)
        const getFollowerNumSpy = jest
            .spyOn(TwitchStreamerApi.prototype, `getFollowerNum`)
            .mockImplementation(async (id: string) => {
                const streamer = allStreamersMockData.find(
                    (streamer) => streamer.id == id
                )
                assert(typeof streamer?.follower_num !== `undefined`)
                return streamer.follower_num
            })
        const getStreamers = jest
            .spyOn(TwitchStreamerApi.prototype, `getStreamers`)
            .mockImplementation(async (ids: Array<string>) => {
                return allStreamersMockData
                    .map((streamer) => {
                        streamer.follower_num = undefined
                        return streamer
                    })
                    .filter((streamer) => ids.includes(streamer.id))
            })

        //実行
        await wrappedStreamerSelection()

        //呼び出し回数チェック
        expect(getJpStreamsSpy).toHaveBeenCalledTimes(1)
        expect(getFollowerNumSpy).toHaveBeenCalledTimes(251)
        expect(getStreamers).toHaveBeenCalledTimes(1)

        const newStreamer = await streamerRepository.getStreamers()
        const newStreamerIds = newStreamer.map((e) => e.id)
        const removedStreamerIds = oldStreamerIds.filter(
            (id) => newStreamerIds.indexOf(id) == -1
        )
        //ドキュメントが作成されている,ストリーマーリストのドキュメントが作成されている
        for (const key in newStreamerIds) {
            const id = newStreamerIds[key]
            await expect(clipRepository.getClip(id)).resolves.toBeDefined()
        }
        //ドキュメントが削除されている
        for (const key in removedStreamerIds) {
            const id = removedStreamerIds[key]
            await expect(clipRepository.getClip(id)).rejects.toThrow()
        }
        //ストリーマー情報チェック
        expect(newStreamer.length).toBeGreaterThan(0)
        //主要な情報があるか
        for (const key in newStreamer) {
            const element = newStreamer[key]
            //idが存在しているか
            expect(element.id).toBeDefined()
            //その他主要な項目があるか
            expect(element.created_at).toBeDefined()
            expect(element.description).toBeDefined()
            expect(element.display_name).toBeDefined()
            expect(element.login).toBeDefined()
            expect(element.profile_image_url).toBeDefined()
            expect(element.follower_num).toBeDefined()
        }
        //順番チェック
        for (let index = 0; index < newStreamer.length - 1; index++) {
            const currentFollowerNum = newStreamer[index].follower_num
            const nextFollowerNum = newStreamer[index + 1].follower_num
            const message = `clips.view_count is undefind`
            assert(typeof currentFollowerNum === `number`, message)
            assert(typeof nextFollowerNum === `number`, message)
            expect(currentFollowerNum).toBeGreaterThanOrEqual(nextFollowerNum)
        }
        //重複チェック
        const newStreamerIdSets = new Set(newStreamerIds)
        expect(newStreamerIdSets.size).toEqual(newStreamerIds.length)
    }, 20000)
})
