import { Token } from "../../src/models/token"

describe("Token", () => {
  test("constructorでプロパティが正しくセットされる", () => {
    const token = new Token("access", 123, "type")

    expect(token.access_token).toBe("access")
    expect(token.expires_in).toBe(123)
    expect(token.token_type).toBe("type")
  })
})
