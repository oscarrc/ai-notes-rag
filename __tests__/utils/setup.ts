// Global test setup file
import '@testing-library/jest-dom';

// Define global types for testing
//@ts-ignore
global.FileNode = {} as FileNode;

// Create a mock for Web Worker environment
class Worker {
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
  postMessage() {}
  terminate() {}
}

// Mock URL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

// Create process.env values needed for tests
process.env.NEXT_PUBLIC_VAULT_PATH = '/vault';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Create stub implementations for missing browser APIs in Node
global.TextEncoder = require('util').TextEncoder;
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock fetch API for tests
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as jest.Mock;

// Mock crypto.randomUUID
if (!global.crypto) {
  global.crypto = {} as Crypto;
}
//@ts-ignore
global.crypto.randomUUID = jest.fn(() => 'test-uuid-123');

// Mock Element.classList for animation tests
Object.defineProperty(Element.prototype, 'classList', {
  value: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn().mockImplementation(className => false),
    toggle: jest.fn()
  }
});