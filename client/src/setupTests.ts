// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });
//import crypto from 'crypto'

//Object.assign(global, { crypto });
/*import { webcrypto } from 'crypto';
global.crypto = webcrypto as Crypto;*/
import { webcrypto } from 'node:crypto';


/*global.crypto = {
    subtle: webcrypto.subtle,
    getRandomValues: webcrypto.getRandomValues,
} as Crypto*/
// Override global.crypto in JSDOM
Object.defineProperty(global, 'crypto', {
    value: {
        subtle: webcrypto.subtle,
        getRandomValues: webcrypto.getRandomValues,
    },
    writable: true, // Allows tests to modify if needed
});

const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
