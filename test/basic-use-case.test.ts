import type {
  ActionsOnly as ActionsOnlyType,
  createSharedStoreHook as CreateSharedStoreHook,
  NoActions as NoActionsType,
} from "../src/index";

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

const ActionsOnly: typeof ActionsOnlyType = index.ActionsOnly;

const NoActions: typeof NoActionsType = index.NoActions;

const defaultActions = `
  forceRerenderSubscribers
  notifySubscribers
  resetState
  setPartialState
  setState
`
  .split(/\s/u)
  .filter(Boolean);

it("should create a basic shared store hook", () => {
  const useSharedStoreHook = createSharedStoreHook();

  expect(typeof useSharedStoreHook).toEqual("function");

  const [state1, actions1] = useSharedStoreHook(); // 1st subscribing component
  const [state2, actions2] = useSharedStoreHook(); // 2nd subscribing component
  const actions3 = useSharedStoreHook(ActionsOnly); // 3rd caller component
  const state3 = useSharedStoreHook(NoActions); // 4th component, subscriber

  expect(React.useMemo).toHaveBeenCalledTimes(4);
  expect(React.useMemo).toHaveBeenNthCalledWith(1, expect.any(Function), [
    false,
    undefined,
  ]);
  expect(React.useMemo).toHaveBeenNthCalledWith(2, expect.any(Function), [
    false,
    undefined,
  ]);
  expect(React.useMemo).toHaveBeenNthCalledWith(3, expect.any(Function), [
    false,
    undefined,
  ]);
  expect(React.useMemo).toHaveBeenNthCalledWith(4, expect.any(Function), [
    true,
    undefined,
  ]);

  expect(React.useState).toHaveBeenCalledTimes(4);
  expect(React.useState).toHaveBeenNthCalledWith(1, {});
  expect(React.useState).toHaveBeenNthCalledWith(2, {});
  expect(React.useState).toHaveBeenNthCalledWith(3, {});
  expect(React.useState).toHaveBeenNthCalledWith(4, {});

  expect(Object.keys(setStateFuncs).length).toEqual(4);

  expect(React.useEffect).toHaveBeenCalledTimes(4);
  expect(React.useEffect).toHaveBeenNthCalledWith(
    1,
    expect.any(Function),
    []
  );
  expect(React.useEffect).toHaveBeenNthCalledWith(
    2,
    expect.any(Function),
    []
  );
  expect(React.useEffect).toHaveBeenNthCalledWith(
    3,
    expect.any(Function),
    []
  );
  expect(React.useEffect).toHaveBeenNthCalledWith(
    4,
    expect.any(Function),
    []
  );

  expect(setStateFuncs[1]).not.toHaveBeenCalled();
  expect(setStateFuncs[2]).not.toHaveBeenCalled();
  expect(setStateFuncs[3]).not.toHaveBeenCalled();
  expect(setStateFuncs[4]).not.toHaveBeenCalled();

  expect(state1).toEqual(undefined);
  expect(state2).toEqual(undefined);
  expect(state3).toEqual(undefined);

  expect(Object.keys(actions1)).toEqual(defaultActions);
  expect(Object.keys(actions2)).toEqual(defaultActions);
  expect(Object.keys(actions3)).toEqual(defaultActions);

  const callback1 = jest.fn();

  expect(callback1).not.toHaveBeenCalled();

  // we can use actions1, actions2 or actions3, they're the same, here
  actions3.setState(
    // we should only be allowed to pass "undefined" here, but this is a test
    // we just need something different from the previous value (undefined)
    42 as unknown as Parameters<typeof actions1.setState>[0],
    callback1
  );

  expect(callback1).toHaveBeenCalledTimes(1);
  expect(callback1).toHaveBeenCalledWith();

  // the setState call triggers a rerender of the 1st caller
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(1);
  expect(setStateFuncs[1]).toHaveBeenCalledWith({});

  // the setState call triggers a rerender of the 2nd caller
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(1);
  expect(setStateFuncs[2]).toHaveBeenNthCalledWith(1, {});

  // the 3rd caller is not rerendered by a state update(ActionsOnly)
  expect(setStateFuncs[3]).not.toHaveBeenCalled();

  // the setState call triggers a rerender of the 4th caller
  expect(setStateFuncs[4]).toHaveBeenCalledTimes(1);
  expect(setStateFuncs[4]).toHaveBeenNthCalledWith(1, {});

  // simulate the unmount of the first caller component
  // (first call to useSharedStoreHook )
  unmountFuncs[1]?.();

  const callback2 = jest.fn();

  actions3.setPartialState(
    // we should only be allowed to pass "undefined" here, but this is a test
    // we just need something different from the previous value (42)
    84 as unknown as Parameters<typeof actions1.setPartialState>[0],
    callback2
  );

  expect(callback2).toHaveBeenCalledTimes(1);
  expect(callback2).toHaveBeenCalledWith();

  // the 1st caller does not receive the update as it is [being] unmounted
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(1);
  expect(setStateFuncs[1]).toHaveBeenCalledWith({});

  // the 2nd caller still receives updates
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(2);
  expect(setStateFuncs[2]).toHaveBeenNthCalledWith(2, {});

  // the 3rd caller still doesn't receive any update (ActionsOnly)
  expect(setStateFuncs[3]).not.toHaveBeenCalled();

  // the 4th caller still receives updates
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(2);
  expect(setStateFuncs[2]).toHaveBeenNthCalledWith(2, {});

  actions2.resetState();

  // the 1st caller does not receive the update as it is unmounted
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(1);
  expect(setStateFuncs[1]).toHaveBeenCalledWith({});

  // the 2nd caller still receives updates
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(3);
  expect(setStateFuncs[2]).toHaveBeenNthCalledWith(3, {});

  // the 3rd caller still doesn't receive any update (ActionsOnly)
  expect(setStateFuncs[3]).not.toHaveBeenCalled();

  // the 4th caller still receives updates
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(3);
  expect(setStateFuncs[2]).toHaveBeenNthCalledWith(3, {});

  actions1.notifySubscribers();

  // nothing has changed
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(1);
  expect(setStateFuncs[1]).toHaveBeenCalledWith({});

  // nothing has changed
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(3);
  expect(setStateFuncs[2]).toHaveBeenNthCalledWith(3, {});

  // nothing has changed
  expect(setStateFuncs[3]).not.toHaveBeenCalled();

  // nothing has changed
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(3);
  expect(setStateFuncs[2]).toHaveBeenNthCalledWith(3, {});

  actions3.forceRerenderSubscribers();

  // the 1st caller does not rerender as it is unmounted
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(1);
  expect(setStateFuncs[1]).toHaveBeenCalledWith({});

  // the 2nd caller reacts to the force rerender
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(4);
  expect(setStateFuncs[2]).toHaveBeenNthCalledWith(4, {});

  // the 3rd caller still doesn't rerender (ActionsOnly)
  expect(setStateFuncs[3]).not.toHaveBeenCalled();

  // the 4th caller reacts to the force rerender
  expect(setStateFuncs[4]).toHaveBeenCalledTimes(4);
  expect(setStateFuncs[4]).toHaveBeenNthCalledWith(4, {});
});
