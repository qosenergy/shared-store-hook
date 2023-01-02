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

it("should throw the expected errors when passed wrong parameters (i.e. in JS)", () => {
  // intentionally pass something that doesn't fulfill the requirements
  let useSharedStoreHook = createSharedStoreHook(
    // @ts-expect-error wrong param type
    42
  );

  let error;

  try {
    error = undefined;
    useSharedStoreHook(
      // @ts-expect-error wrong param type
      42
    );
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("mapState is not a function"));

  try {
    error = undefined;
    useSharedStoreHook(
      // @ts-expect-error wrong param type
      [42]
    );
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("mapFunction is not a function"));

  try {
    error = undefined;
    useSharedStoreHook(
      // @ts-expect-error wrong param type
      jest.fn(),
      42
    );
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("mapActions is not a function"));

  useSharedStoreHook = createSharedStoreHook();

  expect(typeof useSharedStoreHook).toEqual("function");

  let actions;

  try {
    error = undefined;
    actions = useSharedStoreHook(ActionsOnly);
    actions["foobar"]();
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("actions.foobar is not a function"));

  try {
    error = undefined;
    actions?.forceRerenderSubscribers();
  } catch (e) {
    error = e;
  }

  expect(error).toBeUndefined();

  try {
    error = undefined;
    // @ts-expect-error shouldn't pass params
    actions?.forceRerenderSubscribers(52);
  } catch (e) {
    error = e;
  }

  expect(error).toBeUndefined();

  try {
    error = undefined;
    // will not error but set the new state to {}
    actions?.setPartialState(52 as unknown as typeof undefined);
  } catch (e) {
    error = e;
  }

  expect(error).toBeUndefined();

  try {
    error = undefined;
    actions?.setPartialState(
      88 as unknown as typeof undefined,
      42 as unknown as () => void
    );
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("afterUpdateCallback is not a function"));

  try {
    error = undefined;
    actions = useSharedStoreHook(ActionsOnly, () => 42);
    // @ts-expect-error Type 'Number' has no call signatures
    actions();
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("actions is not a function"));

  try {
    error = undefined;
    useSharedStoreHook = createSharedStoreHook(
      // @ts-expect-error wrong param type
      () => "foo"
    );
  } catch (e) {
    error = e;
  }

  // it will act just as { actions: undefined, initialState: undefined }
  expect(error).toBeUndefined();

  try {
    error = undefined;
    useSharedStoreHook = createSharedStoreHook(
      // @ts-expect-error wrong param type
      { actions: 42 }
    );
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("optionalActions is not a function"));
});
