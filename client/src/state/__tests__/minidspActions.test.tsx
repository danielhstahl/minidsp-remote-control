import { render } from "@testing-library/react";
import {
  MinidspAction,
  useMiniDspParams,
  miniDspReducer,
  MiniDspProvider,
} from "../minidspActions";
import { Preset, Source, Power } from "../../services/api";

describe("minidspReducer", () => {
  const initialState = {
    preset: Preset.preset1,
    source: Source.USB,
    volume: -127,
    power: Power.On,
  };

  it("should return initial state when called with unknown action", () => {
    // @ts-ignore - Testing invalid action type
    const result = miniDspReducer(initialState, { type: "UNKNOWN", value: {} });
    expect(result).toBe(initialState);
  });

  it("should update state when called with UPDATE action", () => {
    const newState = {
      preset: Preset.preset2,
      source: Source.Toslink,
      volume: -50,
      power: Power.Off,
    };

    const result = miniDspReducer(initialState, {
      type: MinidspAction.UPDATE,
      value: newState,
    });

    expect(result).toEqual(newState);
  });
});

describe("WriteProvider and useWriteParams", () => {
  it("should provide initial state to children", () => {
    const TestComponent = () => {
      const { state } = useMiniDspParams();
      return <div data-testid="test">{JSON.stringify(state)}</div>;
    };

    const { getByTestId } = render(
      <MiniDspProvider>
        <TestComponent />
      </MiniDspProvider>
    );

    const element = getByTestId("test");
    expect(JSON.parse(element.textContent!)).toEqual({
      preset: Preset.preset1,
      source: Source.USB,
      volume: -127,
      power: Power.On,
    });
  });
});
