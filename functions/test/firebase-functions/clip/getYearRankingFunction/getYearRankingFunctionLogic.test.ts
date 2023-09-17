import axios from "axios";
import { GetYearRankingFunctionLogic } from '../../../../src/firebase-functions/clip/getYearRankingFunction/getYearRankingFunctionLogic';

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
})