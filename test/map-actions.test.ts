import { ActionsOnly, createSharedStoreHook } from "../src/index";
import type { ReactShape } from "../src/types";

/* eslint-disable @typescript-eslint/unbound-method */

const React = {
  useEffect: jest.fn(),
  useMemo: jest.fn((fn: () => unknown) => fn()),
  useState: jest.fn(() => []),
} as unknown as ReactShape;

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

  const useSharedStoreHook = createSharedStoreHook(React, {
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
