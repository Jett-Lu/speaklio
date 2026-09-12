import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLocalState, resetState, state, serializeState } from '../state.mjs';
import { createAssistant } from '../assistant.mjs';

test('local data survives serialization and ignores retired authentication state', () => {
  resetState();
  state.hydration.ml = 750;
  state.installedPlugins.add('hydration');
  const saved = { ...serializeState(), authenticated: true };
  const restored = loadLocalState({ getItem: () => JSON.stringify(saved) });
  assert.equal(restored.hydration.ml, 750);
  assert.equal(restored.installedPlugins.has('hydration'), true);
  assert.equal('authenticated' in restored, false);
});

test('unreadable storage still opens a fresh dashboard', () => {
  assert.equal(loadLocalState({ getItem: () => '{broken' }).hydration.ml, 0);
  assert.equal(loadLocalState({ getItem() { throw new Error('Unavailable'); } }).hydration.ml, 0);
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true, get() { throw new Error('Storage access denied'); },
    });
    assert.equal(loadLocalState().hydration.ml, 0);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});

test('local assistant logs and summarizes without any network transport', async () => {
  resetState();
  state.installedPlugins.add('hydration');
  const messages = [];
  const processRequest = createAssistant({
    addMessage: (text) => messages.push(text),
    addActivity() {}, saveState() {}, renderAll() {}, showToast() {},
    logWater: async amount => { state.hydration.ml += amount; },
    logMindfulness() {}, completeWorkout() {},
  });
  await processRequest('I drank 500 ml of water');
  assert.equal(state.hydration.ml, 500);
  await processRequest('How much water have I had?');
  assert.match(messages.at(-1), /0\.5/);
  await processRequest('How is my progress?');
  assert.match(messages.at(-1), /daily balance/);
  resetState();
  assert.equal(state.hydration.ml, 0);
  await processRequest('I drank 500 ml of water');
  assert.equal(state.hydration.ml, 0);
  assert.match(messages.at(-1), /not installed/);
});
