export declare type ActionsFromSharedStore<SharedStoreState> = (store: Readonly<SharedStore<SharedStoreState>>) => Record<string, (...args: Array<any>) => unknown>;
export declare const ActionsOnly: unique symbol;
export declare const NoActions: unique symbol;
export interface DefaultSharedStoreActions<SharedStoreState> {
    readonly forceRerenderSubscribers: () => void;
    readonly notifySubscribers: () => void;
    readonly resetState: () => void;
    readonly setPartialState: (partialNewStateOrPartialUpdateFunction: Partial<SharedStoreState> | ((state: SharedStoreState) => Partial<SharedStoreState>), afterUpdateCallback?: () => void) => void;
    readonly setState: (newStateOrUpdateFunction: SharedStoreState | ((state: SharedStoreState) => SharedStoreState), afterUpdateCallback?: () => void) => void;
}
export interface SharedStore<SharedStoreState> extends DefaultSharedStoreActions<SharedStoreState> {
    state: SharedStoreState;
}
export interface Subscriber {
    isComponentBeingUnmounted: boolean;
    lastKnownMappedState: unknown;
    readonly rerender: () => void;
    readonly rerenderIfMappedStateHasChanged: () => void;
}
export declare type SharedStoreActions<SharedStoreState, SharedStoreActionsWithoutDefaults extends ActionsFromSharedStore<SharedStoreState>> = DefaultSharedStoreActions<SharedStoreState> & ReturnType<SharedStoreActionsWithoutDefaults>;
export declare type UseSharedStoreHook<SharedStoreState, SharedStoreActionsWithoutDefaults extends ActionsFromSharedStore<SharedStoreState>, PartialState = Partial<SharedStoreState>, Actions = SharedStoreActions<SharedStoreState, SharedStoreActionsWithoutDefaults>, PartialActions = Partial<Actions>> = (() => [SharedStoreState, Actions]) & (<MappedState = PartialState>(mapState1?: (state: SharedStoreState) => MappedState) => [MappedState, Actions]) & (<MappedStateArray = Array<PartialState>>(mapState2?: Array<(state: SharedStoreState) => unknown>) => [MappedStateArray, Actions]) & ((mapState3: typeof ActionsOnly) => Actions) & (<MappedActions = PartialActions>(mapState4: typeof ActionsOnly, mapActions4?: (actions: Actions) => MappedActions) => MappedActions) & ((mapState5: typeof NoActions) => SharedStoreState) & (<MappedState = PartialState>(mapState6: ((state: SharedStoreState) => MappedState) | undefined, mapActions6: typeof NoActions) => MappedState) & (<MappedStateArray = Array<PartialState>>(mapState7: Array<(state: SharedStoreState) => unknown> | undefined, mapActions7: typeof NoActions) => MappedStateArray) & (<MappedState = PartialState, MappedActions = PartialActions>(mapState8?: (state: SharedStoreState) => MappedState, mapActions8?: (actions: Actions) => MappedActions) => [MappedState, MappedActions]) & (<MappedStateArray = Array<PartialState>, MappedActions = PartialActions>(mapState9?: Array<(state: SharedStoreState) => unknown>, mapActions9?: (actions: Actions) => MappedActions) => [MappedStateArray, MappedActions]);
