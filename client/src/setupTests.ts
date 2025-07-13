// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });

import { webcrypto } from 'node:crypto';
import 'whatwg-fetch'; //polyfill fetch

//use node instead of jsdom for crypto
Object.defineProperty(global, 'crypto', {
    value: {
        subtle: webcrypto.subtle,
        getRandomValues: webcrypto.getRandomValues,
    },
    writable: true, // Allows tests to modify if needed
});

