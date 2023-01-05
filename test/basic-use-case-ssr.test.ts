import type {
  // ActionsOnly as ActionsOnlyType,
  createSharedStoreHook as CreateSharedStoreHook,
  // NoActions as NoActionsType,
  SharedStore,
} from "../src/index";
import { renderHook, act } from '@testing-library/react-hooks/server' // will use react-dom/server

const index = require("../src/index");

const createSharedStoreHook: typeof CreateSharedStoreHook =
  index.createSharedStoreHook;

type myModel = {
  counter: number
  text: string
}
const initialState: myModel = {
  counter: 0,
  text: "something"
}

export const SetMyModelActions = (store: SharedStore<myModel>) => ({
  increaseCounter: () => {
    store.setState((state) => {
      const counter = state.counter++
      return { ...state, counter }
    })
  },
  setText: (updatedText: string) => {
    store.setState((state) => {
      return { ...state, text: updatedText }
    })
  }
});

it("should create a basic shared store hook", async () => {

  const useSharedStoreHook = createSharedStoreHook<myModel, typeof SetMyModelActions>({
    actions: SetMyModelActions,
    initialState: initialState,
  });

  const page1 = renderHook(() => useSharedStoreHook());
  const page2 = renderHook(() => useSharedStoreHook());
  const page3 = renderHook(() => useSharedStoreHook());
  expect(page1.result.current[0].counter).toBe(0)
  page1.hydrate();
  page2.hydrate();
  expect(page1.result.current[0].counter).toBe(0)

  act(() => {
    page1.result.current[1].setState({...page1.result.current[0], counter: page1.result.current[0].counter+1})
  })
  expect(page1.result.current[0].counter).toBe(1)
  act(() => {
    page1.result.current[1].setState({...page1.result.current[0], counter: page1.result.current[0].counter+1})
  })
  expect(page1.result.current[0].counter).toBe(2)
  expect(page2.result.current[0].counter).toBe(2)

  act(() => {
    page2.result.current[1].setState({...page2.result.current[0], counter: page2.result.current[0].counter+1})
  })
  expect(page1.result.current[0].counter).toBe(3)

  act(() => {
    page1.result.current[1].setText("changed");
  })

  expect(page2.result.current[0].text).toBe("changed")
  
  page3.hydrate();
  expect(page3.result.current[0].text).toBe("changed")
  expect(page3.result.current[0].counter).toBe(3)
});