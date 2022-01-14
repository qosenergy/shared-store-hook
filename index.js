"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSharedStoreHook = exports.NoActions = exports.ActionsOnly = void 0;
const react_1 = __importDefault(require("react"));
const types_1 = require("./types");
Object.defineProperty(exports, "ActionsOnly", { enumerable: true, get: function () { return types_1.ActionsOnly; } });
Object.defineProperty(exports, "NoActions", { enumerable: true, get: function () { return types_1.NoActions; } });
const createSharedStoreHook = ({ actions: optionalActions, initialState, } = {}) => {
    const subscribers = new Set();
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
    const notifySubscribersAndCallback = (afterUpdateCallback) => {
        subscriberActions.notifySubscribers();
        afterUpdateCallback && afterUpdateCallback();
    };
    const defaultActions = Object.assign(Object.assign({}, subscriberActions), { resetState: () => {
            store.setState(initialState);
        }, setPartialState: (partialNewStateOrPartialUpdateFunction, afterUpdateCallback) => {
            let partialNewState;
            if (typeof partialNewStateOrPartialUpdateFunction === "function") {
                partialNewState = partialNewStateOrPartialUpdateFunction(store.state);
            }
            else {
                partialNewState = partialNewStateOrPartialUpdateFunction;
            }
            store.state = Object.assign(Object.assign({}, store.state), partialNewState);
            notifySubscribersAndCallback(afterUpdateCallback);
        }, setState: (newStateOrUpdateFunction, afterUpdateCallback) => {
            let newState;
            if (typeof newStateOrUpdateFunction === "function") {
                newState = newStateOrUpdateFunction(store.state);
            }
            else {
                newState = newStateOrUpdateFunction;
            }
            store.state = newState;
            notifySubscribersAndCallback(afterUpdateCallback);
        } });
    const store = Object.assign(Object.assign({}, defaultActions), { state: initialState });
    let actionsWithDefaults = defaultActions;
    if (optionalActions) {
        actionsWithDefaults = Object.assign(Object.assign({}, actionsWithDefaults), optionalActions(store));
    }
    const useSharedStoreHook = (mapState, mapActions) => {
        const isActionsOnly = mapState === types_1.ActionsOnly;
        const isNoActions = mapState === types_1.NoActions || mapActions === types_1.NoActions;
        const mappedActions = react_1.default.useMemo(() => isNoActions
            ? undefined
            : mapActions
                ? mapActions(actionsWithDefaults)
                : actionsWithDefaults, [isNoActions, mapActions]);
        let getMappedState;
        let mappedState;
        if (!isActionsOnly) {
            getMappedState = () => mapState && mapState !== types_1.NoActions
                ? Array.isArray(mapState)
                    ? mapState.map((mapFunction) => mapFunction(store.state))
                    : mapState(store.state)
                : store.state;
            mappedState = getMappedState();
        }
        const [, setStateFromReactHook] = react_1.default.useState(Object.create(null));
        react_1.default.useLayoutEffect(() => {
            if (isActionsOnly) {
                return undefined;
            }
            const subscriber = {
                isComponentBeingUnmounted: false,
                lastKnownMappedState: mappedState,
                rerender: () => setStateFromReactHook(Object.create(null)),
                rerenderIfMappedStateHasChanged: () => {
                    if (subscriber.isComponentBeingUnmounted) {
                        return;
                    }
                    const mappedState = getMappedState();
                    let hasStateChanged;
                    if (Array.isArray(mapState)) {
                        hasStateChanged = mappedState.some((stateElement, index) => !Object.is(stateElement, subscriber.lastKnownMappedState[index]));
                    }
                    else {
                        hasStateChanged = !Object.is(mappedState, subscriber.lastKnownMappedState);
                    }
                    if (!hasStateChanged) {
                        return;
                    }
                    subscriber.lastKnownMappedState = mappedState;
                    subscriber.rerender();
                },
            };
            subscribers.add(subscriber);
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
    return useSharedStoreHook;
};
exports.createSharedStoreHook = createSharedStoreHook;
