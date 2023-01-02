import React from "react";
import { ActionsOnly, NoActions } from "./types";

import type {
  ActionsFromSharedStore,
  DefaultSharedStoreActions,
  SharedStore,
  SharedStoreActions,
  Subscriber,
  UseSharedStoreHook,
} from "./types";

export { ActionsOnly, NoActions };

export type {
  DefaultSharedStoreActions,
  SharedStore,
  SharedStoreActions,
  UseSharedStoreHook,
};

export const createSharedStoreHook = <
  SharedStoreState = undefined,
  SharedStoreActionsWithoutDefaults extends ActionsFromSharedStore<SharedStoreState> = ActionsFromSharedStore<SharedStoreState>
>({
  actions: optionalActions,
  initialState,
}: {
  actions?: SharedStoreActionsWithoutDefaults;
  initialState?: SharedStoreState;
} = {}): UseSharedStoreHook<
  SharedStoreState,
  SharedStoreActionsWithoutDefaults
> => {
  const subscribers = new Set<Subscriber>();

  const subscriberActions = {
    forceRerenderSubscribers: () => {
      subscribers.forEach((subscriber) => {
        subscriber.rerender();
      });
    },
    notifySubscribers: () => {
      subscribers.forEach((subscriber) => {
        subscriber.rerenderIfMappedStateHasChanged();
      });
    },
  };

  const notifySubscribersAndCallback = (afterUpdateCallback?: () => void) => {
    subscriberActions.notifySubscribers();

    afterUpdateCallback && afterUpdateCallback();
  };

  const defaultActions: DefaultSharedStoreActions<SharedStoreState> = {
    ...subscriberActions,
    resetState: () => {
      store.setState(initialState as SharedStoreState);
    },
    setPartialState: (
      partialNewStateOrPartialUpdateFunction,
      afterUpdateCallback?
    ) => {
      let partialNewState: Partial<SharedStoreState>;

      if (typeof partialNewStateOrPartialUpdateFunction === "function") {
        partialNewState = partialNewStateOrPartialUpdateFunction(store.state);
      } else {
        partialNewState = partialNewStateOrPartialUpdateFunction;
      }

      store.state = {
        ...store.state,
        ...partialNewState,
      };

      notifySubscribersAndCallback(afterUpdateCallback);
    },
    setState: (newStateOrUpdateFunction, afterUpdateCallback?) => {
      let newState: SharedStoreState;

      if (typeof newStateOrUpdateFunction === "function") {
        newState = (
          newStateOrUpdateFunction as (
            state: SharedStoreState
          ) => SharedStoreState
        )(store.state);
      } else {
        newState = newStateOrUpdateFunction;
      }

      store.state = newState;

      notifySubscribersAndCallback(afterUpdateCallback);
    },
  };

  const store = {
    ...defaultActions,
    state: initialState,
  } as unknown as SharedStore<SharedStoreState>;

  let actionsWithDefaults = defaultActions as SharedStoreActions<
    SharedStoreState,
    SharedStoreActionsWithoutDefaults
  >;

  if (optionalActions) {
    actionsWithDefaults = {
      ...actionsWithDefaults,
      ...optionalActions(store),
    } as unknown as SharedStoreActions<
      SharedStoreState,
      SharedStoreActionsWithoutDefaults
    >;
  }

  const useSharedStoreHook = <
    MappedState = SharedStoreState,
    MappedActions = Partial<
      SharedStoreActions<SharedStoreState, SharedStoreActionsWithoutDefaults>
    >
  >(
    mapState?:
      | ((state: SharedStoreState) => MappedState)
      | Array<(state: SharedStoreState) => MappedState>
      | typeof ActionsOnly
      | typeof NoActions,
    mapActions?:
      | ((
          actions: SharedStoreActions<
            SharedStoreState,
            SharedStoreActionsWithoutDefaults
          >
        ) => MappedActions)
      | typeof NoActions
  ) => {
    const isActionsOnly = mapState === ActionsOnly;

    const isNoActions = mapState === NoActions || mapActions === NoActions;

    const mappedActions = React.useMemo(
      () =>
        isNoActions
          ? undefined
          : mapActions
          ? mapActions(actionsWithDefaults)
          : actionsWithDefaults,
      [isNoActions, mapActions]
    ) as MappedActions;

    let getMappedState: () =>
      | SharedStoreState
      | MappedState
      | MappedState[]
      | undefined;

    let mappedState: ReturnType<typeof getMappedState>;

    if (!isActionsOnly) {
      getMappedState = () =>
        mapState && mapState !== NoActions
          ? Array.isArray(mapState)
            ? mapState.map((mapFunction) => mapFunction(store.state))
            : mapState(store.state)
          : store.state;

      mappedState = getMappedState();
    }

    // eslint-disable-next-line no-null/no-null
    const [, setStateFromReactHook] = React.useState(Object.create(null));

    React.useEffect(() => {
      if (isActionsOnly) {
        return undefined;
      }

      const subscriber: Subscriber = {
        isComponentBeingUnmounted: false,
        lastKnownMappedState: mappedState,
        // call setState with a new reference to trigger a re-render
        // eslint-disable-next-line no-null/no-null
        rerender: () => setStateFromReactHook(Object.create(null)),
        rerenderIfMappedStateHasChanged: () => {
          /* istanbul ignore next */
          if (subscriber.isComponentBeingUnmounted) {
            // do not update a component which is being unmounted
            return;
          }

          const mappedState = getMappedState();

          let hasStateChanged: boolean;

          if (Array.isArray(mapState)) {
            hasStateChanged = (mappedState as MappedState[]).some(
              (stateElement, index) =>
                !Object.is(
                  stateElement,
                  (subscriber.lastKnownMappedState as MappedState[])[index]
                )
            );
          } else {
            hasStateChanged = !Object.is(
              mappedState,
              subscriber.lastKnownMappedState
            );
          }

          if (!hasStateChanged) {
            return;
          }

          subscriber.lastKnownMappedState = mappedState;

          subscriber.rerender();
        },
      };

      subscribers.add(subscriber);

      // the function below is triggered when a subscriber is unmounted
      return () => {
        subscriber.isComponentBeingUnmounted = true;
        subscribers.delete(subscriber);
      };
    }, []);

    return isActionsOnly
      ? mappedActions
      : isNoActions
      ? mappedState
      : [mappedState, mappedActions];
  };

  return useSharedStoreHook as UseSharedStoreHook<
    SharedStoreState,
    SharedStoreActionsWithoutDefaults
  >;
};
