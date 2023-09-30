import axios from "axios"

import { StreamerSelectionLogic } from "../../../../src/firebase-functions/streamer/streamerSelection/streamerSelectionLogic"
import { Stream } from "../../../../src/models/stream"
import { Streamer } from "../../../../src/models/streamer"
import { BatchRepository } from "../../../../src/repositories/batch"
import { ClipRepository } from "../../../../src/repositories/clip"
import { StreamerRepository } from "../../../../src/repositories/streamer"

jest.mock(`axios`)

describe(`StreamerSelectionLogicのテスト`, () => {
    let streamerSelectionLogic: StreamerSelectionLogic
    const mockedAxios = axios as jest.MockedFunction<typeof axios>
    beforeAll(async () => {
        mockedAxios.mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`
            }
        })
        streamerSelectionLogic = await StreamerSelectionLogic.init()
    })
    afterEach(() => jest.restoreAllMocks())
    test(`getOldStreamerのテスト`, async () => {
        mockedAxios.mockResolvedValueOnce({ data: { total: 400 } })
        mockedAxios.mockResolvedValueOnce({ data: { total: 500 } })
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

        const { oldStreamers, oldStreamerIds } =
            await streamerSelectionLogic.getOldStreamer()

        expect(getStreamersSpy).toHaveBeenCalled()
        expect(oldStreamers.map((e) => e.id)).toEqual(oldStreamerIds)
        expect(oldStreamers).toEqual([
            new Streamer({
                id: `49207184`,
                follower_num: 400
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 500
            })
        ])
    }, 100000)
    test(`getOldStreamerのテスト:axiosエラー`, async () => {
        mockedAxios.mockRejectedValueOnce(new Error(`axios error test`))
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

        await expect(streamerSelectionLogic.getOldStreamer()).rejects.toThrowError()
        expect(getStreamersSpy).toHaveBeenCalled()
    }, 100000)
    test(`getOldStreamerのテスト:firestoreエラー`, async () => {
        mockedAxios.mockResolvedValueOnce({ data: { total: 400 } })
        mockedAxios.mockResolvedValueOnce({ data: { total: 500 } })
        const getStreamersSpy = jest
            .spyOn(StreamerRepository.prototype, `getStreamers`)
            .mockRejectedValueOnce(new Error(`firestore error test`))

        await expect(streamerSelectionLogic.getOldStreamer()).rejects.toThrowError()
        expect(getStreamersSpy).toHaveBeenCalled()
    }, 100000)
    test(`getJpLiveStreamingのテスト`, async () => {
        const mockData = [...Array(100)].map(
            (_, index) =>
                new Stream({
                    user_id: `${index}`,
                    tags: [``],
                    language: `ja`,
                    viewer_count: index
                })
        )
        mockedAxios.mockResolvedValueOnce({ data: { data: mockData } })

        const streams = await streamerSelectionLogic.getJpLiveStreaming()

        expect(streams.length).toEqual(100)
        for (let index = 0; index < streams.length; index++) {
            const stream = streams[index]
            expect(stream.user_id).toEqual(`${index}`)
            expect(stream.tags).toEqual([``])
            expect(stream.language).toEqual(`ja`)
            expect(stream.viewer_count).toEqual(index)
        }
    }, 100000)
    test(`getJpLiveStreamingのテスト:axiosエラー`, async () => {
        mockedAxios.mockRejectedValueOnce(new Error(`axios error test`))
        await expect(streamerSelectionLogic.getJpLiveStreaming()).rejects.toThrowError()
    }, 100000)
    test(`filterStreamsのテスト`, () => {
        const oldStreamerIdsMockData = [`102631269`, `104363564`]
        const streamsMockData = [
            //追加
            new Stream({
                user_id: `49207184`,
                tags: [``],
                viewer_count: 500
            }),
            //重複削除
            new Stream({
                user_id: `49207184`,
                tags: [``],
                viewer_count: 400
            }),
            // タグで削除
            new Stream({
                user_id: `545050196`,
                tags: [`Commissions`, `日本語`],
                viewer_count: 300
            }),
            // idで削除
            new Stream({
                user_id: `126482446`,
                tags: [``],
                viewer_count: 300
            }),
            // 既存
            new Stream({
                user_id: `104363564`,
                tags: [``],
                viewer_count: 300
            }),
            // viewr count足りない
            new Stream({
                user_id: `104363564`,
                tags: [``],
                viewer_count: 200
            })
        ]

        const newStreamerIds = streamerSelectionLogic.filterStreams(
            streamsMockData,
            oldStreamerIdsMockData
        )

        expect(newStreamerIds).toEqual([`49207184`])
    }, 100000)
    test(`getNewStreamerFollowerのテスト`, async () => {
        mockedAxios.mockResolvedValueOnce({ data: { total: 400 } })
        mockedAxios.mockResolvedValueOnce({ data: { total: 500 } })
        const ids = [`49207184`, `545050196`]

        const newStreamers = await streamerSelectionLogic.getNewStreamerFollower(ids)

        expect(newStreamers).toEqual([
            new Streamer({
                id: `49207184`,
                follower_num: 400
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 500
            })
        ])
    }, 100000)
    test(`getNewStreamerFollowerのテスト:axiosエラー`, async () => {
        mockedAxios.mockRejectedValueOnce(new Error(`axios error test`))
        const ids = [`49207184`, `545050196`]

        expect(streamerSelectionLogic.getNewStreamerFollower(ids)).rejects.toThrowError()
    }, 100000)
    test(`concatAndFilterのテスト`, () => {
        const streamerNumLimit = 250
        const oldStreamers = [...Array(streamerNumLimit - 5)].map(
            (_, index) =>
                new Streamer({
                    id: `${index}`,
                    follower_num: 400 - index
                })
        )
        const newStreamers = [...Array(10)].map(
            (_, index) =>
                new Streamer({
                    id: `${index + streamerNumLimit - 5}`,
                    follower_num: 600 - index
                })
        )
        const { selectedStreamers, removedStreamerIds, addedStreamerIds } =
            streamerSelectionLogic.concatAndFilter(oldStreamers, newStreamers)

        const expectSelectedStreamers = newStreamers
            .concat(oldStreamers)
            .slice(0, streamerNumLimit)
        expect(selectedStreamers).toEqual(expectSelectedStreamers)
        expect(removedStreamerIds).toEqual(oldStreamers.map((e) => e.id).slice(-5))
        expect(addedStreamerIds).toEqual(newStreamers.map((e) => e.id))
    }, 100000)
    test.todo(`clipDoc内にも情報の格納`)
    test(`updateStreamerInfoのテスト`, async () => {
        const mockData = [
            new Streamer({
                broadcaster_type: `partner`,
                created_at: `2013-09-19T13:21:29Z`,
                description: ``,
                display_name: `fps_shaka`,
                id: `49207184`,
                login: `fps_shaka`,
                offline_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/282d883a-8e00-4fd3-88fa-bfcbd370c2cd-channel_offline_image-1920x1080.jpeg`,
                profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/61f568bf-884b-4126-b17c-fc525c6d3bd4-profile_image-300x300.png`,
                type: ``,
                view_count: 0
            }),
            new Streamer({
                broadcaster_type: `partner`,
                created_at: `2020-06-18T04:04:09Z`,
                description: `命尽き果てるまで`,
                display_name: `加藤純一です`,
                id: `545050196`,
                login: `kato_junichi0817`,
                offline_image_url: ``,
                profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/a4977cfd-1962-41ec-9355-ab2611b97552-profile_image-300x300.png`,
                type: ``,
                view_count: 0
            })
        ]
        mockedAxios.mockResolvedValueOnce({ data: { data: mockData } })

        const selectedStreamers = [
            new Streamer({
                id: `49207184`,
                follower_num: 100
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 200
            })
        ]
        const storedStreamers =
            await streamerSelectionLogic.updateStreamerInfo(selectedStreamers)
        const expectData = JSON.parse(JSON.stringify(mockData)).reverse()
        expectData[0].follower_num = 200
        expectData[1].follower_num = 100
        expect(storedStreamers).toEqual(expectData)
    }, 100000)
    test(`updateStreamerInfoのテスト:axiosエラー`, async () => {
        mockedAxios.mockRejectedValueOnce(new Error(`axios error test`))

        const selectedStreamers = [
            new Streamer({
                id: `49207184`,
                follower_num: 100
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 200
            })
        ]
        expect(
            streamerSelectionLogic.updateStreamerInfo(selectedStreamers)
        ).rejects.toThrowError()
    }, 100000)
    test(`updateFirestoreのテスト`, async () => {
        const updateStreamers = jest
            .spyOn(StreamerRepository.prototype, `batchUpdateStreamers`)
            .mockImplementation()
        const deleteClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchDeleteClipDoc`)
            .mockImplementation()
        const createClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchCreateClipDoc`)
            .mockImplementation()
        const commitBatchSpy = jest
            .spyOn(BatchRepository.prototype, `commitBatch`)
            .mockResolvedValueOnce()

        const storedStreamers = [
            new Streamer({
                broadcaster_type: `partner`,
                created_at: `2013-09-19T13:21:29Z`,
                description: ``,
                display_name: `fps_shaka`,
                id: `49207184`,
                login: `fps_shaka`,
                offline_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/282d883a-8e00-4fd3-88fa-bfcbd370c2cd-channel_offline_image-1920x1080.jpeg`,
                profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/61f568bf-884b-4126-b17c-fc525c6d3bd4-profile_image-300x300.png`,
                type: ``,
                view_count: 0,
                follower_num: 100
            }),
            new Streamer({
                broadcaster_type: `partner`,
                created_at: `2020-06-18T04:04:09Z`,
                description: `命尽き果てるまで`,
                display_name: `加藤純一です`,
                id: `545050196`,
                login: `kato_junichi0817`,
                offline_image_url: ``,
                profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/a4977cfd-1962-41ec-9355-ab2611b97552-profile_image-300x300.png`,
                type: ``,
                view_count: 0,
                follower_num: 200
            })
        ]
        const removeStreamerIds = [`102631269`, `104363564`]
        const addedStreamerIds = [`126482446`]

        await streamerSelectionLogic.updateFirestore(
            storedStreamers,
            removeStreamerIds,
            addedStreamerIds
        )

        expect(updateStreamers).toHaveBeenCalledTimes(1)
        expect(updateStreamers.mock.calls[0][0]).toEqual(storedStreamers)
        expect(deleteClipDocSpy).toHaveBeenCalledTimes(2)
        expect(deleteClipDocSpy.mock.calls[0][0]).toEqual(removeStreamerIds[0])
        expect(deleteClipDocSpy.mock.calls[1][0]).toEqual(removeStreamerIds[1])
        expect(createClipDocSpy).toHaveBeenCalledTimes(1)
        expect(createClipDocSpy.mock.calls[0][0]).toEqual(addedStreamerIds[0])
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    }, 100000)
    test(`updateFirestoreのテスト:batchエラー`, async () => {
        const updateStreamers = jest
            .spyOn(StreamerRepository.prototype, `batchUpdateStreamers`)
            .mockImplementation()
        const deleteClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchDeleteClipDoc`)
            .mockImplementation()
        const createClipDocSpy = jest
            .spyOn(ClipRepository.prototype, `batchCreateClipDoc`)
            .mockImplementation()
        const commitBatchSpy = jest
            .spyOn(BatchRepository.prototype, `commitBatch`)
            .mockRejectedValueOnce(new Error(`batch error test`))

        const storedStreamers = [
            new Streamer({
                broadcaster_type: `partner`,
                created_at: `2013-09-19T13:21:29Z`,
                description: ``,
                display_name: `fps_shaka`,
                id: `49207184`,
                login: `fps_shaka`,
                offline_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/282d883a-8e00-4fd3-88fa-bfcbd370c2cd-channel_offline_image-1920x1080.jpeg`,
                profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/61f568bf-884b-4126-b17c-fc525c6d3bd4-profile_image-300x300.png`,
                type: ``,
                view_count: 0,
                follower_num: 100
            }),
            new Streamer({
                broadcaster_type: `partner`,
                created_at: `2020-06-18T04:04:09Z`,
                description: `命尽き果てるまで`,
                display_name: `加藤純一です`,
                id: `545050196`,
                login: `kato_junichi0817`,
                offline_image_url: ``,
                profile_image_url: `https://static-cdn.jtvnw.net/jtv_user_pictures/a4977cfd-1962-41ec-9355-ab2611b97552-profile_image-300x300.png`,
                type: ``,
                view_count: 0,
                follower_num: 200
            })
        ]
        const removeStreamerIds = [`102631269`, `104363564`]
        const addedStreamerIds = [`126482446`]

        await expect(
            streamerSelectionLogic.updateFirestore(
                storedStreamers,
                removeStreamerIds,
                addedStreamerIds
            )
        ).rejects.toThrowError()

        expect(updateStreamers).toHaveBeenCalledTimes(1)
        expect(updateStreamers.mock.calls[0][0]).toEqual(storedStreamers)
        expect(deleteClipDocSpy).toHaveBeenCalledTimes(2)
        expect(deleteClipDocSpy.mock.calls[0][0]).toEqual(removeStreamerIds[0])
        expect(deleteClipDocSpy.mock.calls[1][0]).toEqual(removeStreamerIds[1])
        expect(createClipDocSpy).toHaveBeenCalledTimes(1)
        expect(createClipDocSpy.mock.calls[0][0]).toEqual(addedStreamerIds[0])
        expect(commitBatchSpy).toHaveBeenCalledTimes(1)
    }, 100000)
})
