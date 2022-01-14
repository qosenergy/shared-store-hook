import { ActionsOnly, NoActions } from "./types";
import type { ActionsFromSharedStore, DefaultSharedStoreActions, SharedStore, SharedStoreActions, UseSharedStoreHook } from "./types";
export { ActionsOnly, NoActions };
export type { DefaultSharedStoreActions, SharedStore, SharedStoreActions, UseSharedStoreHook, };
export declare const createSharedStoreHook: <SharedStoreState = undefined, SharedStoreActionsWithoutDefaults extends ActionsFromSharedStore<SharedStoreState> = ActionsFromSharedStore<SharedStoreState>>({ actions: optionalActions, initialState, }?: {
    actions?: SharedStoreActionsWithoutDefaults;
    initialState?: SharedStoreState;
}) => UseSharedStoreHook<SharedStoreState, SharedStoreActionsWithoutDefaults, Partial<SharedStoreState>, SharedStoreActions<SharedStoreState, SharedStoreActionsWithoutDefaults>, Partial<SharedStoreActions<SharedStoreState, SharedStoreActionsWithoutDefaults>>>;
