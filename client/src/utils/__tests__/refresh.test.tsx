import { filterState, AuthCondition } from "../refresh";

describe("filterState", () => {
    it("returns authRequiredJwt if requireAuth and jwt", () => {
        expect(filterState("hello", true)).toEqual(AuthCondition.authRequiredJwt)
    })
    it("returns authRequiredNoJwt if requireAuth and no jwt", () => {
        expect(filterState("", true)).toEqual(AuthCondition.authRequiredNoJwt)
    })
    it("returns noAuthRequiredNoJwt if not requireAuth and no jwt", () => {
        expect(filterState("", false)).toEqual(AuthCondition.noAuthRequiredNoJwt)
    })
    it("returns noAuthRequiredNoJwt if not requireAuth and jwt", () => {
        expect(filterState("hello", false)).toEqual(AuthCondition.noAuthRequiredNoJwt)
    })
})