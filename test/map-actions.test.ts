import type {
  ActionsOnly as ActionsOnlyType,
  createSharedStoreHook as CreateSharedStoreHook,
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

const defaultActions = `
  forceRerenderSubscribers
  notifySubscribers
  resetState
  setPartialState
  setState
`
  .split(/\s/u)
  .filter(Boolean);

it("should return the correct mapped actions", () => {
  const actionOne = () => undefined;

  const optionalActions = () => ({
    actionOne,
  });

  const useSharedStoreHook = createSharedStoreHook({
    actions: optionalActions,
  });

  let actions = useSharedStoreHook(ActionsOnly);

  expect(Object.keys(actions)).toEqual([...defaultActions, "actionOne"]);

  actions = useSharedStoreHook(ActionsOnly, (ac) =>
    Object.fromEntries(
      Object.entries(ac).filter(([actionName]) => actionName !== "actionOne")
    )
  ) as typeof actions;

  expect(Object.keys(actions)).toEqual(defaultActions);
});
