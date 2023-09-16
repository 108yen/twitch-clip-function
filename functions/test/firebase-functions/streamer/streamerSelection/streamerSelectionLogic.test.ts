import axios from 'axios';
import { StreamerSelectionLogic } from '../../../../src/firebase-functions/streamer/streamerSelection/streamerSelectionLogic';
// import { Stream } from "../../../../src/models/stream";
import { Streamer } from '../../../../src/models/streamer';
import { StreamerRepository } from '../../../../src/repositories/streamer';
// import { Token } from '../../../../src/models/token';

jest.mock(`axios`);

describe(`StreamerSelectionLogicのテスト`, () => {
    let streamerSelectionLogic: StreamerSelectionLogic;
    beforeAll(async () => {
        (axios as any).mockResolvedValueOnce({
            data: {
                access_token: `test`,
                expire_in: 0,
                token_type: `test`,
            }
        });
        streamerSelectionLogic = await StreamerSelectionLogic.init();
    })
    afterEach(() => jest.restoreAllMocks())
    test(`getOldStreamerのテスト`, async () => {
        (axios as any).mockResolvedValueOnce({ data: { total: 400 } });
        (axios as any).mockResolvedValueOnce({ data: { total: 500 } });
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

        const { oldStreamers, oldStreamerIds } = await streamerSelectionLogic.getOldStreamer();

        expect(getStreamersSpy).toHaveBeenCalled();
        expect(oldStreamers.map(e => e.id)).toEqual(oldStreamerIds);
        expect(oldStreamers).toEqual([
            new Streamer({
                id: `49207184`,
                follower_num: 400,
            }),
            new Streamer({
                id: `545050196`,
                follower_num: 500,
            })
        ]);
    }, 100000)
    // test(`getJpLiveStreamingのテスト`, async () => {
    //     const streams = await streamerSelectionLogic.getJpLiveStreaming();
    //     expect(streams.length).toBeGreaterThan(90);
    //     for (const key in streams) {
    //         if (Object.prototype.hasOwnProperty.call(streams, key)) {
    //             const stream = streams[key];
    //             expect(stream.language).toEqual(`ja`);
    //         }
    //     }
    // }, 100000)
    // test(`filterStreamsのテスト`, async () => {
    //     const oldStreamerIdsMockData = [
    //         `102631269`,
    //         `104363564`,
    //     ];
    //     const streamsMockData = [
    //         //追加
    //         new Stream({
    //             user_id: `49207184`,
    //             tags: [``],
    //             viewer_count: 300,
    //         }),
    //         //重複削除
    //         new Stream({
    //             user_id: `49207184`,
    //             tags: [``],
    //             viewer_count: 400,
    //         }),
    //         // タグで削除
    //         new Stream({
    //             user_id: `545050196`,
    //             tags: [`Commissions`, `日本語`],
    //             viewer_count: 300,
    //         }),
    //         // idで削除
    //         new Stream({
    //             user_id: `126482446`,
    //             tags: [``],
    //             viewer_count: 300,
    //         }),
    //         // 既存
    //         new Stream({
    //             user_id: `104363564`,
    //             tags: [``],
    //             viewer_count: 300,
    //         }),
    //         // viewr count足りない
    //         new Stream({
    //             user_id: `104363564`,
    //             tags: [``],
    //             viewer_count: 200,
    //         }),
    //     ];
    //     const newStreamerIds = streamerSelectionLogic
    //         .filterStreams(streamsMockData, oldStreamerIdsMockData);
    //     expect(newStreamerIds).toEqual([`49207184`]);
    // }, 100000)
    // test(`getNewStreamerFollowerのテスト`, async () => {
    //     const ids = [`49207184`];
    //     const newStreamers = await streamerSelectionLogic
    //         .getNewStreamerFollower(ids);
    //     expect(newStreamers.length).toEqual(ids.length);
    //     for (const key in newStreamers) {
    //         if (Object.prototype.hasOwnProperty.call(newStreamers, key)) {
    //             const streamer = newStreamers[key];
    //             expect(streamer.follower_num).toBeDefined();
    //         }
    //     }
    // }, 100000)
    // test(`concatAndFilterのテスト`, async () => {
    //     const oldStreamers = [...Array(195)]
    //         .map((_, index) => new Streamer({
    //             id: `${index}`,
    //             follower_num: 400 - index,
    //         }));
    //     const newStreamers = [...Array(10)]
    //         .map((_, index) => new Streamer({
    //             id: `${index + 195}`,
    //             follower_num: 500 - index,
    //         }))
    //     const { selectedStreamers, removedStreamerIds, addedStreamerIds } = streamerSelectionLogic
    //         .concatAndFilter(oldStreamers, newStreamers);

    //     const expectSelectedStreamers = newStreamers
    //         .concat(oldStreamers)
    //         .slice(0, 200);
    //     expect(selectedStreamers).toEqual(expectSelectedStreamers);
    //     expect(removedStreamerIds).toEqual(oldStreamers.map(e => e.id).slice(-5));
    //     expect(addedStreamerIds).toEqual(newStreamers.map(e => e.id));

    // }, 100000)
    // test(`updateStreamerInfoのテスト`, async () => {
    //     const selectedStreamers = [
    //         new Streamer({
    //             id: `49207184`,
    //             follower_num: 100,
    //         }),
    //         new Streamer({
    //             id: `545050196`,
    //             follower_num: 200,
    //         })
    //     ];
    //     const storedStreamers = await streamerSelectionLogic
    //         .updateStreamerInfo(selectedStreamers);
    //     expect(storedStreamers.length).toEqual(selectedStreamers.length);
    //     expect(storedStreamers.find(e => e.id == `49207184`)).toBeDefined();
    //     expect(storedStreamers.find(e => e.id == `545050196`)).toBeDefined();
    //     for (const key in storedStreamers) {
    //         if (Object.prototype.hasOwnProperty.call(storedStreamers, key)) {
    //             const streamer = storedStreamers[key];
    //             //idが存在しているか
    //             expect(streamer.id).toBeDefined();
    //             //その他主要な項目があるか
    //             expect(streamer.created_at).toBeDefined();
    //             expect(streamer.description).toBeDefined();
    //             expect(streamer.display_name).toBeDefined();
    //             expect(streamer.login).toBeDefined();
    //             expect(streamer.profile_image_url).toBeDefined();
    //             expect(streamer.follower_num).toBeDefined();
    //         }
    //     }
    // }, 100000)
    // test(`updateFirestoreのテスト`, async () => {

    // }, 100000)
})