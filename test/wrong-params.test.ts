import { ActionsOnly, createSharedStoreHook, NoActions } from "../src/index";
import type { ReactShape } from "../src/types";

it("should throw the expected errors when passed wrong parameters (i.e. in JS)", () => {
  // intentionally pass something that doesn't fulfill the requirements
  let useSharedStoreHook = createSharedStoreHook(42 as unknown as ReactShape);

  expect(typeof useSharedStoreHook).toEqual("function");

  let error;

  try {
    error = undefined;
    useSharedStoreHook();
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("React.useMemo is not a function"));

  useSharedStoreHook = createSharedStoreHook({
    useMemo: jest.fn(),
  } as unknown as ReactShape);

  expect(typeof useSharedStoreHook).toEqual("function");

  try {
    error = undefined;
    useSharedStoreHook();
  } catch (e) {
    error = e;
  }

  expect(error instanceof TypeError).toBeTruthy();

  expect(
    (error as TypeError).message.endsWith(
      " is not a function or its return value is not iterable"
    )
  ).toBeTruthy();

  useSharedStoreHook = createSharedStoreHook({
    useMemo: jest.fn,
    useState: jest.fn(),
  } as unknown as ReactShape);

  expect(typeof useSharedStoreHook).toEqual("function");

  try {
    error = undefined;
    useSharedStoreHook();
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(
    new TypeError(
      "undefined is not iterable (cannot read property Symbol(Symbol.iterator))"
    )
  );

  useSharedStoreHook = createSharedStoreHook({
    useMemo: () => undefined,
    useState: () => [],
  } as unknown as ReactShape);

  expect(typeof useSharedStoreHook).toEqual("function");

  try {
    error = undefined;
    useSharedStoreHook();
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("React.useEffect is not a function"));

  useSharedStoreHook = createSharedStoreHook({
    useEffect: (fn: () => unknown) => fn(),
    useMemo: (fn: () => unknown) => fn(),
    useState: () => [],
  } as unknown as ReactShape);

  expect(typeof useSharedStoreHook).toEqual("function");

  try {
    error = undefined;
    useSharedStoreHook();
  } catch (e) {
    error = e;
  }

  expect(error).toBeUndefined();

  try {
    error = undefined;
    useSharedStoreHook(42 as unknown as typeof NoActions);
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("mapState is not a function"));

  try {
    error = undefined;
    useSharedStoreHook([42] as unknown as typeof NoActions);
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("mapFunction is not a function"));

  try {
    error = undefined;
    useSharedStoreHook(jest.fn(), 42 as unknown as () => unknown);
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("mapActions is not a function"));

  try {
    error = undefined;
    const actions = useSharedStoreHook(ActionsOnly);
    actions.forceRerenderSubscribers();
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(
    new TypeError("setStateFromReactHook is not a function")
  );

  useSharedStoreHook = createSharedStoreHook({
    useEffect: (fn: () => unknown) => fn(),
    useMemo: (fn: () => unknown) => fn(),
    useState: () => [undefined, jest.fn()],
  } as unknown as ReactShape);

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
      {
        useEffect: (fn: () => unknown) => fn(),
        useMemo: (fn: () => unknown) => fn(),
        useState: () => [undefined, jest.fn()],
      } as unknown as ReactShape,
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
      {
        useEffect: (fn: () => unknown) => fn(),
        useMemo: (fn: () => unknown) => fn(),
        useState: () => [undefined, jest.fn()],
      } as unknown as ReactShape,
      // @ts-expect-error wrong param type
      { actions: 42 }
    );
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new TypeError("optionalActions is not a function"));
});
