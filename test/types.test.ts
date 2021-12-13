import { ActionsOnly, NoActions } from "../src/types";

it("should export the correct symbols", () => {
  expect(typeof ActionsOnly).toEqual("symbol");

  let description =
    "return (potentially mapped) actions only, do not re-render if any part of the state changes";

  expect(ActionsOnly.description).toEqual(description);

  expect(ActionsOnly.toString()).toEqual(`Symbol(${description})`);

  description = "return (potentially mapped) state only, re-render if needed";

  expect(typeof NoActions).toEqual("symbol");

  expect(NoActions.description).toEqual(description);

  expect(NoActions.toString()).toEqual(`Symbol(${description})`);
});
