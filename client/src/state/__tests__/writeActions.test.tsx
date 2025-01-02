import { render } from '@testing-library/react';
import { WriteProvider, useWriteParams, writeReducer, WriteAction } from '../writeActions';
import { Preset, Source, Power } from '../../services/api';
import React from 'react';

describe('writeReducer', () => {
    const initialState = {
        preset: Preset.preset1,
        source: Source.USB,
        volume: -127,
        power: Power.On
    };

    it('should return initial state when called with unknown action', () => {
        // @ts-ignore - Testing invalid action type
        const result = writeReducer(initialState, { type: 'UNKNOWN', value: {} });
        expect(result).toBe(initialState);
    });

    it('should update state when called with UPDATE action', () => {
        const newState = {
            preset: Preset.preset2,
            source: Source.Toslink,
            volume: -50,
            power: Power.Off
        };

        const result = writeReducer(initialState, {
            type: WriteAction.UPDATE,
            value: newState
        });

        expect(result).toEqual(newState);
    });
});

describe('WriteProvider and useWriteParams', () => {
    it('should provide initial state to children', () => {
        const TestComponent = () => {
            const { state } = useWriteParams();
            return <div data-testid="test">{JSON.stringify(state)}</div>;
        };

        const { getByTestId } = render(
            <WriteProvider>
                <TestComponent />
            </WriteProvider>
        );

        const element = getByTestId('test');
        expect(JSON.parse(element.textContent!)).toEqual({
            preset: Preset.preset1,
            source: Source.USB,
            volume: -127,
            power: Power.On
        });
    });


}); 