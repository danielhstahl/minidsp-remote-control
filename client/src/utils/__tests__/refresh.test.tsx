import { filterState, AuthCondition, refreshStatus } from "../refresh";

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

describe("refreshStatus", () => {
    it("runs func if has jwt and requireAuth", () => {
        const mock = jest.fn()
        refreshStatus("hello", true, mock)
        expect(mock.mock.calls).toHaveLength(1)
    })
    it("runs func if no jwt and no requireAuth", () => {
        const mock = jest.fn()
        refreshStatus("", false, mock)
        expect(mock.mock.calls).toHaveLength(1)
    })
    it("does not run func if no jwt and requireAuth", () => {
        const mock = jest.fn()
        refreshStatus("", true, mock)
        expect(mock.mock.calls).toHaveLength(0)
    })
    it("runs func if jwt and no requireAuth", () => {
        const mock = jest.fn()
        refreshStatus("hello", false, mock)
        expect(mock.mock.calls).toHaveLength(1)
    })
})