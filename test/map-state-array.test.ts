import type { createSharedStoreHook as CreateSharedStoreHook } from "../src/index";

let subscriberCounter = 0;
const setStateFuncs: { [id: number]: () => void } = {};
const unmountFuncs: { [id: number]: (() => void) | undefined } = {};

const mockSetState = () => {
  subscriberCounter += 1;

  const setStateFunc = jest.fn();

  setStateFuncs[subscriberCounter] = setStateFunc;

  return setStateFunc;
};

const mockuseEffect = (fn: () => () => void) => {
  unmountFuncs[subscriberCounter] = fn();
};

const React = {
  useEffect: jest.fn(mockuseEffect),
  useMemo: jest.fn((fn: () => unknown) => fn()),
  useState: jest.fn(() => [undefined, mockSetState()]),
};

jest.mock("react", () => React);

const index = require("../src/index");

const createSharedStoreHook: typeof CreateSharedStoreHook =
  index.createSharedStoreHook;

it("should re-render only when any mapped state in the array has changed", () => {
  const initialState = { fieldOne: 42, fieldTwo: 84, otherField: false };

  const useSharedStoreHook = createSharedStoreHook({
    actions: (store) => ({ getState: () => store.state }),
    initialState,
  });

  expect(typeof useSharedStoreHook).toEqual("function");

  const mapState1 = jest.fn((state: typeof initialState) => state.fieldOne);
  const mapState2 = jest.fn((state: typeof initialState) => state.fieldTwo);
  const mapState3 = jest.fn(
    (state: typeof initialState) => (state.fieldOne + state.fieldTwo) % 2 === 0
  );

  const [stateArray, actions] = useSharedStoreHook([
    mapState1,
    mapState2,
    mapState3,
  ]);

  expect(mapState1).toHaveBeenCalledTimes(1);
  expect(mapState2).toHaveBeenCalledTimes(1);
  expect(mapState3).toHaveBeenCalledTimes(1);

  expect(mapState1).toHaveBeenNthCalledWith(1, initialState);
  expect(mapState2).toHaveBeenNthCalledWith(1, initialState);
  expect(mapState3).toHaveBeenNthCalledWith(1, initialState);

  expect(stateArray).toEqual([
    initialState.fieldOne, // result of mapState1
    initialState.fieldTwo, // result of mapState2
    true, // result of mapState3
  ]);

  expect(setStateFuncs[1]).not.toHaveBeenCalled();

  actions.resetState();

  expect(actions.getState()).toEqual(initialState);

  expect(mapState1).toHaveBeenCalledTimes(2);
  expect(mapState2).toHaveBeenCalledTimes(2);
  expect(mapState3).toHaveBeenCalledTimes(2);

  expect(mapState1).toHaveBeenNthCalledWith(2, initialState);
  expect(mapState2).toHaveBeenNthCalledWith(2, initialState);
  expect(mapState3).toHaveBeenNthCalledWith(2, initialState);

  // nothing has changed in the mapped states, no re-render
  expect(setStateFuncs[1]).not.toHaveBeenCalled();

  actions.setState(initialState);

  expect(actions.getState()).toEqual(initialState);

  expect(mapState1).toHaveBeenCalledTimes(3);
  expect(mapState2).toHaveBeenCalledTimes(3);
  expect(mapState3).toHaveBeenCalledTimes(3);

  expect(mapState1).toHaveBeenNthCalledWith(3, initialState);
  expect(mapState2).toHaveBeenNthCalledWith(3, initialState);
  expect(mapState3).toHaveBeenNthCalledWith(3, initialState);

  // nothing has changed in the mapped states, no re-render
  expect(setStateFuncs[1]).not.toHaveBeenCalled();

  const update = { fieldTwo: 7 };

  actions.setPartialState(update);

  let newState: typeof initialState = {
    fieldOne: 42,
    fieldTwo: 7,
    otherField: false,
  };

  expect(actions.getState()).toEqual(newState);

  expect(mapState1).toHaveBeenCalledTimes(4);
  expect(mapState2).toHaveBeenCalledTimes(4);
  expect(mapState3).toHaveBeenCalledTimes(4);

  expect(mapState1).toHaveBeenNthCalledWith(4, newState);
  expect(mapState2).toHaveBeenNthCalledWith(4, newState);
  expect(mapState3).toHaveBeenNthCalledWith(4, newState);

  // both mapState2 and mapState3 have returned a different value than before,
  // so there are 2 reasons to re-render
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(1);

  actions.setPartialState((_state) => update); // same thing as before

  expect(actions.getState()).toEqual(newState);

  // nothing has changed in the mapped states, no re-render
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(1);

  actions.setPartialState({ fieldOne: 3 });

  expect(actions.getState()).toEqual({
    fieldOne: 3,
    fieldTwo: 7,
    otherField: false,
  });

  // both mapState1 and mapState3 have returned a different value than before,
  // so there are 2 reasons to re-render
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(2);

  newState = { fieldOne: 5, fieldTwo: 9, otherField: false };

  actions.setState((_state) => newState);

  expect(actions.getState()).toEqual(newState);

  // both mapState1 and mapState2 have returned a different value than before,
  // so there are 2 reasons to re-render
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(3);

  newState = { fieldOne: 7, fieldTwo: 9, otherField: false };

  actions.setState(newState);

  expect(actions.getState()).toEqual(newState);

  // mapState1 has returned a different value than before,
  // so there is 1 reason to re-render
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(4);

  newState = { fieldOne: 7, fieldTwo: 9, otherField: true };

  actions.setState(newState);

  expect(actions.getState()).toEqual(newState);

  // none of the mapped states in the array care about otherField, so even
  // though it has changed, no re-render is triggered
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(4);
});
