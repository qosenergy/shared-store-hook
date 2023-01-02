import type {
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

const NoActions: typeof NoActionsType = index.NoActions;

it("should re-render only when the relevant mapped state has changed", () => {
  const initialState = { fieldOne: 42, fieldTwo: 84 };

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

  const [state1, actions] = useSharedStoreHook();
  const state2 = useSharedStoreHook(mapState1, NoActions);
  const state3 = useSharedStoreHook(mapState2, NoActions);
  const state4 = useSharedStoreHook(mapState3, NoActions);

  expect(mapState1).toHaveBeenCalledTimes(1);
  expect(mapState2).toHaveBeenCalledTimes(1);
  expect(mapState3).toHaveBeenCalledTimes(1);

  expect(mapState1).toHaveBeenNthCalledWith(1, initialState);
  expect(mapState2).toHaveBeenNthCalledWith(1, initialState);
  expect(mapState3).toHaveBeenNthCalledWith(1, initialState);

  expect(state1).toEqual(initialState);
  expect(state2).toEqual(initialState.fieldOne);
  expect(state3).toEqual(initialState.fieldTwo);
  expect(state4).toEqual(true);

  expect(setStateFuncs[1]).not.toHaveBeenCalled();
  expect(setStateFuncs[2]).not.toHaveBeenCalled();
  expect(setStateFuncs[3]).not.toHaveBeenCalled();
  expect(setStateFuncs[4]).not.toHaveBeenCalled();

  actions.resetState();

  expect(actions.getState()).toEqual(initialState);

  expect(mapState1).toHaveBeenCalledTimes(2);
  expect(mapState2).toHaveBeenCalledTimes(2);
  expect(mapState3).toHaveBeenCalledTimes(2);

  expect(mapState1).toHaveBeenNthCalledWith(2, initialState);
  expect(mapState2).toHaveBeenNthCalledWith(2, initialState);
  expect(mapState3).toHaveBeenNthCalledWith(2, initialState);

  // the first caller does not re-render as the state still has the same
  // reference value
  expect(setStateFuncs[1]).not.toHaveBeenCalled();

  // the second caller is only re-rendered when fieldOne changes
  expect(setStateFuncs[2]).not.toHaveBeenCalled();

  // the third caller is only re-rendered when fieldTwo changes
  expect(setStateFuncs[3]).not.toHaveBeenCalled();

  // the fourth caller is only re-rendered when the sum of the two fields was
  // odd and is now even, or vice versa
  // we haven't changed anything yet
  expect(setStateFuncs[4]).not.toHaveBeenCalled();

  actions.setState(initialState);

  expect(actions.getState()).toEqual(initialState);

  expect(mapState1).toHaveBeenCalledTimes(3);
  expect(mapState2).toHaveBeenCalledTimes(3);
  expect(mapState3).toHaveBeenCalledTimes(3);

  expect(mapState1).toHaveBeenNthCalledWith(3, initialState);
  expect(mapState2).toHaveBeenNthCalledWith(3, initialState);
  expect(mapState3).toHaveBeenNthCalledWith(3, initialState);

  // the first caller does not re-render as the state still has the same
  // reference value
  expect(setStateFuncs[1]).not.toHaveBeenCalled();

  // the second caller is only re-rendered when fieldOne changes
  expect(setStateFuncs[2]).not.toHaveBeenCalled();

  // the third caller is only re-rendered when fieldTwo changes
  expect(setStateFuncs[3]).not.toHaveBeenCalled();

  // the fourth caller is only re-rendered when the sum of the two fields was
  // odd and is now even, or vice versa
  // we haven't changed anything yet
  expect(setStateFuncs[4]).not.toHaveBeenCalled();

  let update: Partial<typeof initialState> = { fieldTwo: 7 };

  actions.setPartialState(update);

  let newState: typeof initialState = { fieldOne: 42, fieldTwo: 7 };

  expect(actions.getState()).toEqual(newState);

  expect(mapState1).toHaveBeenCalledTimes(4);
  expect(mapState2).toHaveBeenCalledTimes(4);
  expect(mapState3).toHaveBeenCalledTimes(4);

  expect(mapState1).toHaveBeenNthCalledWith(4, newState);
  expect(mapState2).toHaveBeenNthCalledWith(4, newState);
  expect(mapState3).toHaveBeenNthCalledWith(4, newState);

  // setPartialState actually recreates a full new state by spreading, so the
  // first caller re-renders because of this different reference value
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(1);

  // the second caller is only re-rendered when fieldOne changes
  expect(setStateFuncs[2]).not.toHaveBeenCalled();

  // the third caller re-renders as fieldTwo has changed
  expect(setStateFuncs[3]).toHaveBeenCalledTimes(1);

  // we've just moved from 42 + 84 = 126 => even to 42 + 7 = 49 => odd
  // so the fourth caller re-renders as well
  expect(setStateFuncs[4]).toHaveBeenCalledTimes(1);

  actions.setPartialState(update); // same thing as before

  expect(actions.getState()).toEqual(newState);

  expect(mapState1).toHaveBeenCalledTimes(5);
  expect(mapState2).toHaveBeenCalledTimes(5);
  expect(mapState3).toHaveBeenCalledTimes(5);

  expect(mapState1).toHaveBeenNthCalledWith(5, newState);
  expect(mapState2).toHaveBeenNthCalledWith(5, newState);
  expect(mapState3).toHaveBeenNthCalledWith(5, newState);

  // setPartialState actually recreates a full new state by spreading, so the
  // first caller re-renders because of this different reference value
  // (even if the field values haven't changed)
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(2);

  // fieldOne hasn't changed
  expect(setStateFuncs[2]).not.toHaveBeenCalled();

  // fieldTwo hasn't changed
  expect(setStateFuncs[3]).toHaveBeenCalledTimes(1);

  // the parity of the sum hasn't changed
  expect(setStateFuncs[4]).toHaveBeenCalledTimes(1);

  update = { fieldOne: 3 };

  actions.setPartialState(update);

  newState = { fieldOne: 3, fieldTwo: 7 };

  expect(actions.getState()).toEqual(newState);

  expect(mapState1).toHaveBeenCalledTimes(6);
  expect(mapState2).toHaveBeenCalledTimes(6);
  expect(mapState3).toHaveBeenCalledTimes(6);

  expect(mapState1).toHaveBeenNthCalledWith(6, newState);
  expect(mapState2).toHaveBeenNthCalledWith(6, newState);
  expect(mapState3).toHaveBeenNthCalledWith(6, newState);

  // setPartialState actually recreates a full new state by spreading, so the
  // first caller re-renders because of this different reference value
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(3);

  // fieldOne has changed
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(1);

  // fieldTwo hasn't changed
  expect(setStateFuncs[3]).toHaveBeenCalledTimes(1);

  // we've just moved from 42 + 7 = 49 => odd to 3 + 7 = 10 => even
  // so the fourth caller re-renders as well
  expect(setStateFuncs[4]).toHaveBeenCalledTimes(2);

  newState = { fieldOne: 5, fieldTwo: 9 };

  actions.setState(newState);

  expect(actions.getState()).toEqual(newState);

  expect(mapState1).toHaveBeenCalledTimes(7);
  expect(mapState2).toHaveBeenCalledTimes(7);
  expect(mapState3).toHaveBeenCalledTimes(7);

  expect(mapState1).toHaveBeenNthCalledWith(7, newState);
  expect(mapState2).toHaveBeenNthCalledWith(7, newState);
  expect(mapState3).toHaveBeenNthCalledWith(7, newState);

  // setPartialState actually recreates a full new state by spreading, so the
  // first caller re-renders because of this different reference value
  expect(setStateFuncs[1]).toHaveBeenCalledTimes(4);

  // fieldOne has changed
  expect(setStateFuncs[2]).toHaveBeenCalledTimes(2);

  // fieldTwo has changed
  expect(setStateFuncs[3]).toHaveBeenCalledTimes(2);

  // we've just moved 3 + 7 = 10 => even to 5 + 9 = 14 => even
  // so the fourth caller does not re-render this time
  expect(setStateFuncs[4]).toHaveBeenCalledTimes(2);
});
