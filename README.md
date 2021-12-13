# shared-store-hook

Easily share state data between several React components.

It's just like [`useState`](https://reactjs.org/docs/hooks-reference.html#usestate), but shared.

---

[**See it in action here**](https://codesandbox.io/s/basic-shared-store-hook-z3s2g?file=/src/components/ComponentA.tsx) (basic example)

[**Explanation here**](#a-basic-example-with-shared-store-hook)

---

## Minimal example

```ts
import React from "react";
import { createSharedStoreHook } from "shared-store-hook";

export const useDarkMode = createSharedStoreHook<boolean>(React);
```

_(If you're [using JavaScript and not TypeScript](#use-in-javascript-instead-of-typescript), just remove the `<boolean>` bit above)_

```tsx
const DarkModeInfo = () => {
  const [isDarkMode] = useDarkMode();

  return <>Dark mode is {isDarkMode ? "on" : "off"}</>;
};
```

```tsx
const DarkModeCheckbox = () => {
  const [isDarkMode, darkModeActions] = useDarkMode();

  return (
    <input
      checked={!!isDarkMode}
      onChange={() => {
        darkModeActions.setState(!isDarkMode);
      }}
      type="checkbox"
    />
  );
};
```

Please see **["A basic example with `shared-store-hook`"](#a-basic-example-with-shared-store-hook)** and **[try the demo](https://codesandbox.io/s/basic-shared-store-hook-z3s2g?file=/src/components/ComponentA.tsx)**.

---

Table of Contents

- [Why should I need this?](#why-should-i-need-this)
- [A refresher on `useState` (feel free to skip this!)](#a-refresher-on-usestate-feel-free-to-skip-this)
- [A few definitions](#a-few-definitions)
- [A basic example with `shared-store-hook`](#a-basic-example-with-shared-store-hook)
- [Actions-only usage](#actions-only-usage)
- [State-only usage](#state-only-usage)
- [Initial state](#initial-state)
- [Default actions](#default-actions)
- [Mapped state (or "state slices")](#mapped-state-or-state-slices)
- [Mapped state arrays (multiple state slices in the same call)](#mapped-state-arrays-multiple-state-slices-in-the-same-call)
- [Custom actions](#custom-actions)
- [Mapped actions](#mapped-actions)
- [Unmount safety](#unmount-safety)
- [Why use this lib and not X or Y?](#why-use-this-lib-and-not-x-or-y)
- [Compatible React versions](#compatible-react-versions)
- [Use in JavaScript instead of TypeScript](#use-in-javascript-instead-of-typescript)
- [Credit](#credit)

# Why should I need this?

If you:

- like the simplicity and features of [`useState`](https://reactjs.org/docs/hooks-reference.html#usestate)
- would love to use the same `useState`-like state across multiple components so that they're in sync
- don't want to use complex libs or write a lot of code just to handle state

**then this lib is for you!**

It is lightweight, but powerful: simple things remain simple, and complex things are easy.

- No dependency (just pass [React](#compatible-react-versions) as an argument!)
- No [Context](#context)
- No HoC
- No boilerplate or [Redux](#redux)-like complexity - you only write what you need
- Everything (including the [client states and actions](#a-few-definitions)) is accurately typed in TypeScript (the lib can also be used in JavaScript)
- [Feels React-y](#it-feels-more-react-y) (uses `useState` internally, as well as `useEffect` and `useMemo`)
- Small footprint - the transpiled code is about 100 lines long (not minified)
- Basic (`useState`-like) and advanced features ([state slices](#mapped-state-or-state-slices), [custom actions](#custom-actions), ..)
- [Unmount safe](#unmount-safety)

Also see: [Why use this lib and not X or Y?](#why-use-this-lib-and-not-x-or-y)

# A refresher on `useState` (feel free to skip this!)

Let's start with React's own [`useState`](https://reactjs.org/docs/hooks-reference.html#usestate):

```tsx
import { useState } from "react";

export const ComponentA = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>();

  const style = isDarkMode
    ? {
        backgroundColor: "black",
        color: "white",
      }
    : {
        backgroundColor: "white",
        color: "black",
      };

  return (
    <div style={{ ...style, padding: "20px 40px" }}>
      <p>Dark mode is {isDarkMode ? "on" : "off"}</p>
      <button onClick={() => setIsDarkMode(!isDarkMode)}>
        Turn {isDarkMode ? "off" : "on"} dark mode
      </button>
    </div>
  );
};
```

(if the `<boolean>` bit confuses you: it's TypeScript, [you can safely remove it in JavaScript](#use-in-javascript-instead-of-typescript)).

You can try this example out here: https://codesandbox.io/s/basic-use-state-dark-mode-yipwt

This is not a real-life example, of course, but let's say we'd like to split the text ("Dark mode is..") and the button into two different components. They'd both need to read `isDarkMode`, and the button would also need to call `setIsDarkMode`, or something using it, to toggle the state.

Now, you could have a top-level component with the `useState` call, that passes down `isDarkMode` and something like `setIsDarkMode` as props to its children components. That is actually the recommended way if the components are close together in the component tree (so the props don't have to be passed down many times over) and there are not too many of them:

```tsx
<div>
  <DarkModeStatus isDarkMode={isDarkMode} />
  <DarkModeToggle
    isDarkMode={isDarkMode}
    toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
  />
</div>
```

But now, for demonstration purposes, let's say `ComponentA`, `DarkModeStatus` and `DarkModeToggle` are nowhere near each other?

Or that about _15_ different components, spread across the app, need to have access to the same information?

You guessed it, a simple and elegant solution is to use a _shared state_, like the ones this lib allows you to create!

# A few definitions

In the example [above](#a-refresher-on-usestate-feel-free-to-skip-this):

```ts
export const ComponentA = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>();
```

- `isDarkMode` is a **state**
- `ComponentA` is a **subscriber** to this state: any change to the state will cause the subscriber to re-render, so that it can do something with the new state value
- `setIsDarkMode` is the function that allows you to change the state, to _act_ upon it - we call this an **action**

With `useState` you can only have one **subscriber** per **state**, as a state is linked to the component creating it.

With `shared-store-hook`, each **shared state** is created _outside_ any component, and may have many **subscribers**, all of which will re-render upon any change to the shared state - or the [part](#mapped-state-or-state-slices) or [parts](#mapped-state-arrays-multiple-state-slices-in-the-same-call) of it they've subscribed to.

`useState` only gives you _one_ action (internally called _dispatch_ in React) and lets you call it whatever you want.

With this lib, you get several **actions** (not just a dispatch), including [**default actions**](#default-actions) provided by the lib and [**custom actions**](#custom-actions) that you can provide if needed.

We call the combination of one state and its related actions a **store**.

When you create a store, you _can_ (but don't have to):

- give it an [**initial state**](#initial-state), the equivalent of passing an argument to `useState` (like `useState(true)`)
- give it [**custom actions**](#custom-actions) to act on the state as you see fit

You can have [actions-only](#actions-only-usage) **users** of the store, that are not **subscribers**: they will be given the **actions**, and may use them to change the **state**, but won't be re-rendered if they, or another component, update it.

# A basic example with `shared-store-hook`

Let's try to reproduce the same functionality as [before](#a-refresher-on-usestate-feel-free-to-skip-this):

```ts
const [isDarkMode, setIsDarkMode] = useState<boolean>();
```

but this time make the `isDarkMode` [state](#a-few-definitions) and the `setIsDarkMode` [action](#a-few-definitions) _shareable_, so that _any_ component in the app may use them, wherever they are.

How do we do this? It's a two step process:

1. we create a _shared store custom hook_ in a file
2. each component interested in reading from and/or writing to the [store](#a-few-definitions)'s state, imports the custom hook from the same file

So we need a file to store (no pun intended) the hook, we'll call it `useDarkMode.ts` (or `.js` in JS).

The [custom hook](https://reactjs.org/docs/hooks-custom.html) we will return needs to follow React's [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html), and be named something like `useXyz`. Naming the file the same thing as its export is not required but is good practice.

So, in `useDarkMode.ts` we need to create a shared store and return a custom hook to use it.

For this, we call this lib's `createSharedStoreHook` function:

```ts
import React from "react";
import { createSharedStoreHook } from "shared-store-hook";

export const useDarkMode = createSharedStoreHook<boolean>(React);
```

Why do we need to pass React as an argument? So that the lib doesn't need it in its `dependencies` or `peerDependencies` and there are no version conflicts.

So, what we've done so far is create a custom hook, and told the lib it's for a **store** that will hold a `boolean` **state**. That's step 1 of the two-step process.

Now how do we read from it or write to it (step 2)?

Like this:

```ts
import { useDarkMode } from "./useDarkMode";

const ComponentUsingDarkMode = () => {
  const [isDarkMode, darkModeActions] = useDarkMode();
```

And _voilà_, shared state! &#x1f381;

_(note that you can't provide the [initial state](#initial-state) as an argument of the hook call, like you could with `useState`. This is because the store has already been created in `useDarkMode.ts`. If you need an [initial state](#initial-state), you have to pass it **there** - see [below](#initial-state) for how)_

You can now use `isDarkMode` the same way you did with the one returned from `useState` above, but this time:

- you can use the lines above _in any component_ and
- anytime a component updates `isDarkMode` to a different value than its current one, _all the [subscribers](#a-few-definitions) of `useDarkMode` will be re-rendered_\*

_(\*: there's also a simple way to [change the state but **not** be re-rendered](#actions-only-usage), or, for more complex states, [only be re-rendered if **parts** of the state have changed](#mapped-state-arrays-multiple-state-slices-in-the-same-call), see [here](#mapped-state-or-state-slices) and [here](#mapped-state-arrays-multiple-state-slices-in-the-same-call))_

**You can see this shared store hook in action here: https://codesandbox.io/s/basic-shared-store-hook-z3s2g?file=/src/components/ComponentA.tsx**

Now, hey - where did `setIsDarkMode` go? And what is this `darkModeActions`?

Remember that although `useState` only returns _one_ action (call it _dispatch_ or `setState`), `useDarkMode` (and any custom hook created by `createSharedStoreHook`) returns [_several_](#default-actions) [actions](#custom-actions), so it actually returns an action _object_, and we chose to call this object `darkModeActions` above.

In this object you will find ([among others](#default-actions)):

- [`setState`](#setstate) that lets you update the whole state
- [`resetState`](#resetstate) that resets the state to its original value
- ..

So, instead of getting back `setIsDarkMode` and calling it directly, you need to call `darkModeActions.setState` instead. You have a little more to write, but you get more than what `useState` can give you ;)

If you only care about [`setState`](#setstate), you could also directly destructure it from the actions, like this:

```ts
const [isDarkMode, { setState }] = useDarkMode();
```

so that you'd call [`setState`](#setstate) to update `isDarkMode`, instead of `darkModeActions.setState`.

But if you use several custom hooks made with this lib in the same component, you will need to differentiate the `setState` actions.

One thing you can do is rename them at the same time you destructure them:

```ts
const [isDarkMode, { setState: setIsDarkMode }] = useDarkMode();
const [isFullScreen, { setState: setIsFullScreen }] = useFullScreen();
```

Note that, whatever option you choose, the state and the actions will be fully typed - see [default actions](#default-actions).

This is just the basic example - this may be all you need, or you may need more.

In the latter case, keep reading to learn about:

- [Actions-only usage](#actions-only-usage)
- [State-only usage](#state-only-usage)
- [Initial state](#initial-state)
- [Default actions](#default-actions)
  - [setting a partial state](#setpartialstate)
  - [post-update callbacks](#setState)
  - [forcing re-renders](#forcererendersubscribers)
- [Mapped state (or "state slices")](#mapped-state-or-state-slices)
- [Mapped state arrays (multiple state slices in the same call)](#mapped-state-arrays-multiple-state-slices-in-the-same-call)
- [Custom actions](#custom-actions)
- [Mapped actions](#mapped-actions)
- [Unmount safety](#unmount-safety)

# Actions-only usage

Sometimes you need to be able to update a shared state that _other_ components will be reading from, but you don't need to read it in the component performing the update (although you could, with a [custom action](#custom-actions)), and, more importantly **_you don't want the updating component to be re-rendered_** following the update.

You could be tempted to do this, but it won't work as you expected:

```js
const [, actions] = useDarkMode();
```

Sure you only got the **actions** back, but just because you didn't assign the **state** to any variable, doesn't mean `useDarkMode()` didn't return it!

When called as `useDarkMode()`, the hook can't tell if you need the state or not, so, just like with `useState`, it returns a `[state, actions]` array.

Choosing to discard `state` like above won't prevent a re-render if it changes.

To do this, you need to use `ActionsOnly`, a symbol exported by the lib:

```ts
import { ActionsOnly } from "shared-store-hook";
import { useDarkMode } from "./useDarkMode";

// ... and later ...

const { setState: setIsDarkMode } = useDarkMode(ActionsOnly);
```

Note that when called with the `ActionsOnly` argument, the hook no longer returns an array, but just the `actions` object, that we destructure to extract `setState` and rename it to `setDarkMode` above. Without the destructuring and renaming it could look like this:

```ts
const darkModeActions = useDarkMode(ActionsOnly);

// ... and later ...

darkModeActions.setState(true);
```

Of course, adding an import for `ActionsOnly` to the custom hook import is not very convenient, so what is typically done is return an extra actions-only hook from the likes of `useDarkMode.ts` (see the last line [here](https://codesandbox.io/s/basic-shared-store-hook-z3s2g?file=/src/state/useSharedCounter.ts) and its use [here](https://codesandbox.io/s/basic-shared-store-hook-z3s2g?file=/src/components/App.tsx) for an example), so that you can write something like:

```ts
import { useDarkModeActions } from "./useDarkMode";

// ... and later ...

const { setIsDarkMode } = useDarkModeActions();
```

# State-only usage

On the flip side of [actions-only uses](#actions-only-usage), you can also have components that need **state-only** access to the shared store - they only need to read from the state (or [parts of it](#mapped-state-arrays-multiple-state-slices-in-the-same-call)) and be re-rendered if the parts of the state they're interested in change, but won't ever need to update the state (or parts of it) themselves.

In other words they're only [**subscribers**](#a-few-definitions), and not "actors".

You could do this, and it would actually work:

```js
const [state] = useDarkMode();
```

You actually got a `[state, actions]` array back from the hook, but you chose to discard the `actions`. You will still be re-rendered if another component updates the state.

However, you can also tell the hook to just return `state` instead of a `[state, actions]` array.

Why would you need this? Arguably you may never need it, but if:

- your state is an object
- you need several components to re-render if [different parts of the state object change](#mapped-state-or-state-slices)
- you need some components to react to any change in [multiple parts of the same state](#mapped-state-arrays-multiple-state-slices-in-the-same-call)

then it will come in handy, to avoid having to write double array-destructuring syntax like `[[subState1, subState2]]` (see [here](#mapped-state-arrays-multiple-state-slices-in-the-same-call)).

So, to only get a ([potentially](#mapped-state-or-state-slices) [mapped](#mapped-state-arrays-multiple-state-slices-in-the-same-call)) state from the hook call, you need to use the `NoActions` symbol exported by the lib:

```ts
import { NoActions } from "shared-store-hook";
import { useDarkMode } from "./useDarkMode";

// ... and later ...

const isDarkMode = useDarkMode(NoActions);
```

Of course, adding an import for `NoActions` to the custom hook import is not very convenient, so what is typically done is return an extra state-only hook from the likes of `useDarkMode.ts`, so that you can write something like:

```ts
import { useDarkModeState } from "./useDarkMode";

// ... and later ...

const isDarkMode = useDarkModeState();
```

Again, this really becomes useful when using [multiple state "slices"](#mapped-state-arrays-multiple-state-slices-in-the-same-call), but otherwise there's nothing wrong with just:

```js
const [isDarkMode] = useDarkMode();
```

# Initial state

With `useState` you can write something like:

```ts
const [isDarkMode, setIsDarkMode] = useState(true);
```

Where `true` is the [**initial state**](https://reactjs.org/docs/hooks-reference.html#usestate) for `isDarkMode`: the value it will hold initially until being changed to something else (er, `false`?) by `setIsDarkMode`.

How do we do the same thing with `shared-store-hook`? For our [previous example](#a-basic-example-with-shared-store-hook), do we do this?:

```ts
const [isDarkMode, darkModeActions] = useDarkMode(true); // doesn't work
```

No, we can't. But there's a good reason for that! ;)

`useDarkMode` (and all the hooks created with this lib) _do_ accept arguments, but they're not the initial state, see:

- [Actions-only usage](#actions-only-usage)
- [State-only usage](#state-only-usage)
- [Mapped state (or "state slices")](#mapped-state-or-state-slices)
- [Mapped state arrays (multiple state slices in the same call)](#mapped-state-arrays-multiple-state-slices-in-the-same-call)
- [Mapped actions](#mapped-actions)

Why can't we just pass the `initialState` here? Because `useDarkMode` and `useState` are different. `useState` has two different behaviours:

- on the first call, it creates the store and sets the state to the `initialState` you provided (or `undefined` if you didn't)
- on subsequent calls, it _reuses the same store_ that was created on the first one

But `useState` is just for one component - when you have several sharing the same store, where do you place the "store creation" step?

For `useDarkMode` (and all the hooks created with this lib), the store creation _happens before the first call to `useDarkMode()`_ - in our [example](#a-basic-example-with-shared-store-hook) it was in `useDarkMode.ts`, when we called `createSharedStoreHook()`.

So _that's_ where we're going to have to set our `initialState`.

To illustrate _how_ we do this, first let's make our sample state more interesting. For `useState`, just like for this lib, the state doesn't have to be as "simple" as a boolean. It could also be an object, for instance:

```ts
const [preferences, setPreferences] = useState({
  isDarkMode: true,
  language: "en",
});
```

or:

```ts
const initialState = {
  isDarkMode: true,
  language: "en",
};

// ... and later ...

const [preferences, setPreferences] = useState(initialState);
```

Let's get back to our `useDarkMode.ts` file from [above](#a-basic-example-with-shared-store-hook):

```ts
import React from "react";
import { createSharedStoreHook } from "shared-store-hook";

export const useDarkMode = createSharedStoreHook<boolean>(React);
```

Only this time, we'll create something a little more elaborate - a custom shared store hook called `usePreferences`, in `usePreferences.ts`:

```ts
import React from "react";
import { createSharedStoreHook } from "shared-store-hook";

const initialState = {
  isDarkMode: true as boolean,
  language: "en" as "en" | "fr" | "uk",
};

export const usePreferences = createSharedStoreHook<typeof initialState>(
  React,
  { initialState }
);
```

or, if you'd rather be more explicit:

```ts
interface usePreferencesState {
  isDarkMode: boolean;
  language: "en" | "fr" | "uk";
}

const initialState: usePreferencesState = {
  isDarkMode: true,
  language: "en",
};

export const usePreferences = createSharedStoreHook<usePreferencesState>(
  React,
  { initialState }
);
```

Contrast this with our first example call of `createSharedStoreHook`:

```ts
export const useDarkMode = createSharedStoreHook<boolean>(React);
```

What's similar is that we still pass the type of the state if we're in TypeScript (then `boolean`, now `usePreferencesState`).

What's different is that we now pass a second argument to `createSharedStoreHook`, an _options object_ on which we set the `initialState` key to the value we've prepared before.

This could of course also be :

```ts
export const usePreferences = createSharedStoreHook<usePreferencesState>(
  React,
  {
    initialState: {
      isDarkMode: true,
      language: "en",
    },
  }
);
```

but it's arguably less legible.

Why pass `initialState` in an options object and not as a simple argument? You guessed it - there's [more than one option](#custom-actions).

In TypeScript, if you provide an `initialState`, it has to be of the type you give to `createSharedStoreHook`.

For instance, if you write `createSharedStoreHook<usePreferencesState>`, then your `initialState` has to be of type `usePreferencesState`.

The [`resetState`](#resetstate) [default action](#default-actions) will set the state back to the value of `initialState`.

If you _don't_ provide an `initialState`, both the state's initial value and the value it is reset to when calling `resetState` will be `undefined`.

This can lead to confusion (and/or bugs) if you provided a state type of, say, `<number>`, or a complex object type, but when you read the state you get `undefined` back - so you're strongly advised to provide one (just like with `useState`, actually).

For _some_ trivial values of state like a boolean or a string, however, if your code would treat `undefined` the same way as it would `false` or `""`, you _may_ get away with _not_ providing an `initialState` - that's what we did in the basic example so as to keep it as simple as possible, but, in real-life apps, being _explicit_ can't hurt!

Note that, with `useState`, the `initialState` [may also be provided in the form of a function](https://reactjs.org/docs/hooks-reference.html#lazy-initial-state), that only gets executed in the "store creation" step of `useState`. In `shared-store-hook`, the call to `createSharedStoreHook` happens _at compile time, not at runtime_, so you always need to provide a _value_ (which _can_ be the result of calling a function, if you like).

# Default actions

Getting back to our example:

```ts
const [isDarkMode, darkModeActions] = useDarkMode();
```

The `darkModeActions` object above (like all the actions from stores created with `shared-store-hook`) will [at least](#custom-actions) store the following functions:

- [`forceRerenderSubscribers`](#forcererendersubscribers)
- [`notifySubscribers`](#notifysubscribers)
- [`resetState`](#resetstate)
- [`setPartialState`](#setpartialstate)
- [`setState`](#setstate)

So you could always, for instance, call this:

```ts
darkModeActions.resetState();
```

Let's start with the last one, as it is essentially similar to what you get with `useState`:

## setState

_Gives a new value to the entire shared state. Re-renders relevant subscribers if needed._

Assuming you created the store with `createSharedStoreHook<MyStateType>(..)`, the `setState` signature is:

```ts
setState: (
  newStateOrUpdateFunction:
    | MyStateType
    | ((state: MyStateType) => MyStateType),
  afterUpdateCallback?: () => void
) => void;
```

Let's unpack this.

The _first argument_ is required, and it is similar to the one in `useState`'s `setState` - it can be one of two things: a value or a function.

- If it is a _value_, it is whatever you want to set the whole state to.

- If it is a _function_, that function will receive the _value of the state at the time of the call to `setState`_, and has to return whatever you want to set the whole state to, just like with `useState`'s [functional updates](https://reactjs.org/docs/hooks-reference.html#functional-updates).

Just like with `useState`, **be careful if you need to store a function in the state**!

Because of functional updates, to store `() => foo` you need to call `setState(() => () => foo)`, because calling just `setState(() => foo)` would store only `foo` and not `() => foo`!

The _second argument_ to `setState`, `afterUpdateCallback`, is optional: if you pass a function here, it will be called once the update to the state has been performed, _even if it resulted in the same value as the previous one and no subscriber has been re-rendered_.

### When would you need functional updates?

The component calling `setState` could be an [actions-only](#actions-only-usage) user of the store, that still needs to set the new value depending on the current value.

Or it could also be a [subscriber](#a-few-definitions) that receives state and actions, and needs to make sure that, at the moment of the update, it uses the latest state value, in case it was updated by another component since it last read it (state update is asynchronous in React).

Whatever the reason, see the warning about `setState(() => () => foo)` above.

### Side effects of setState

Calling `setState` won't have any impact on [actions-only](#actions-only-usage) users of the store.

For **subscribers**, the effects may vary, depending on the value you're passing, and whether or not the subscribers use [mapped state](#mapped-state-or-state-slices), or a [mapped state array](#mapped-state-arrays-multiple-state-slices-in-the-same-call).

Whatever value you pass, `mapState` functions will be called if they were provided.

If the "new" state value you pass is the _same_ as the current state value [**_according to `Object.is()`_**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is), then nothing else will happen (besides `afterUpdateCallback` being called if it was provided) - _[unless you've done something sneaky in a custom action](#notifysubscribers)_.

If the new value is different:

- every subscriber _not_ using `mapState` functions will be re-rendered with this new value,
- subscribers using _one_ `mapState` function will be re-rendered with the new _mapped_ value **_if and only if_** the new mapped value [differs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is#Description) from the current mapped value,
- subscribers using several `mapState` functions (a mapped state array) will be re-rendered with the new _mapped_ values **_if and only if_** at least _one_ of the new mapped values [differs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is#Description) from the current mapped value at the same index in the array.

## setPartialState

_Gives a new value to the entire shared state **by only providing parts of it**. Re-renders relevant subscribers if needed._

Assuming you created the store with `createSharedStoreHook<MyStateType>(..)`, the `setPartialState` signature is:

```ts
setPartialState: (
  partialNewStateOrPartialUpdateFunction:
    | Partial<MyStateType>
    | ((state: MyStateType) => Partial<MyStateType>),
  afterUpdateCallback?: () => void
) => void;
```

As you can see, it is very similar to the one for [`setState`](#setstate), with "partial" added here and there.

Despite its name, `setPartialState` does _**not** only update a **part** of the state_, it updates the **whole state**, just like [`setState`](#setstate) does, but allows you to only _provide_ the _parts_ of the state you want to update: a whole **_new state_** is built by merging the current one and the updated parts.

This is the way [the `setState` method found in class components](https://reactjs.org/docs/react-component.html#setstate) works.

In `shared-store-hook`, the only difference between [`setState`](#setstate) and `setPartialState` is the form of the first argument you provide. For everything else, the effects of `setPartialState` are the exact same ones as [`setState`](#setstate).

Let's say your current state is:

```ts
{
  fieldOne: "one",
  fieldTwo: "two",
}
```

the next two calls are _strictly equivalent_:

```ts
setState({ fieldOne: "one", fieldTwo: "four" });
```

```ts
setPartialState({ fieldTwo: "four" });
```

In the second instance, the current state is merged with the provided update, yielding the same resulting state as the first instance:

```ts
{
  fieldOne: "one",
  fieldTwo: "four",
}
```

So `setPartialState` is just a _courtesy function_, saving you from having to write one of these statements:

```ts
setState({ ...currentState, fieldTwo: "four" });
```

```ts
setState((currentState) => ({ ...currentState, fieldTwo: "four" }));
```

_(see how to store a **function** in the state in [`setState`](#setstate))_

The side effects of `setPartialState` are exactly the same as those described [here](#side-effects-of-setstate).

If your intention is really to **_only update a part of the state_**, see [`notifySubscribers`](#notifysubscribers).

## resetState

_Resets the shared state to the [initial state](#initial-state) provided at store creation, or to `undefined` if none was provided. Re-renders relevant subscribers if needed._

```ts
resetState: () => void;
```

Internally calls `setState(initialState)`, so see [side effects of setState](#side-effects-of-setstate).

## forceRerenderSubscribers

_Triggers a re-render of **all** the subscribers of a store, whether anything has changed in the state or not._

```ts
forceRerenderSubscribers: () => void;
```

## notifySubscribers

_Asks all subscribers to compare their last known value of the (potentially [mapped](<(#mapped-state-or-state-slices)>)) state to its current (potentially [mapped](#mapped-state-arrays-multiple-state-slices-in-the-same-call)) value and re-render if it has changed._

```ts
notifySubscribers: () => void;
```

This is what [`setState`](#setstate) and [`setPartialState`](#setpartialstate) call internally once they have updated the state value (possibly to the same value as before).

Why would you want to call this independently?

It could save your application many re-renders if:

- you use large and complex shared states
- you use [mapped states](#mapped-state-or-state-slices) or [mapped state arrays](#mapped-state-arrays-multiple-state-slices-in-the-same-call)
- you use [custom actions](#custom-actions)

Otherwise, you may never need it. Let's see an example where you _would_ need it.

Say your state is an array representing a large table, and each element in the array is a line, represented by an object, holding one entry per column of the table.

We're going to picture this as a TODO list, something like this:

```ts
[
  {
    description: "First thing to do",
    isDone: false,
    timeEstimateInMn: 10,
  },
  {
    description: "Second thing to do",
    isDone: true,
    timeEstimateInMn: 60,
  },
  {
    description: "Third thing to do",
    isDone: false,
    timeEstimateInMn: 120,
  },
  ...
]
```

In our app, we have a `<TodoTable>` component to display the whole list:

<table>
<tr><th>Done?</th><th>Task description</th><th>Time estimate (mn)</th></tr>
<tr><td>&#x2610;</td><td>First thing to do</td><td>10</td></tr>
<tr><td>&#x2611;</td><td>Second thing to do</td><td>60</td></tr>
<tr><td>&#x2610;</td><td>Third thing to do</td><td>120</td></tr>
</table>

Each line is rendered by a `<TodoLine>` component. To prevent _every_ line from being re-rendered when just _one_ item is marked as done, for instance, we figured we'd use a [mapped state](#mapped-state-or-state-slices) for each line - something like this:

```ts
export const TodoLine = ({ lineIndex }: { lineIndex: number }) => {
  const [todoItem, todoActions] = useTodoList((state) => state[lineIndex]);
  //
  // for <TodoLine lineIndex={1} />, todoItem looks like this:
  //
  // {
  //   description: "Second thing to do",
  //   isDone: true,
  //   timeEstimateInMn: 60,
  // }
  //
};
```

This looks great: `<TodoTable>` only has to render one `<TodoLine>` per item, giving it its index in the table, and then each line is independent: changing something in any given `todoItem` object won't re-render `<TodoTable>` or any other `<TodoLine>`.

**Or will it?** The answer is: it might, depending on how you perform the update.

Does it matter? Not really for a 3-item list, but what if your state had **5000 entries**?

_Then_ making sure only the _relevant_ line re-renders becomes an important issue.

So how do we update the `todoItem` above _the right way_?

If we use `todoActions.setState`, [a whole new state is created](#setstate), spanning the 5000 entries.

This means that, _for every `<TodoLine>`_, the _reference value_ of the object returned by the `mapState` function `(state) => state[lineIndex]` _will now be different - even if the **data** in the line object remains the same - and this will cause a re-render of the component._

One box checked, 5000 components re-rendered. So `setState` is out of the picture.

What about [`setPartialState`](#setpartialstate)? Well, the issue is [essentially the same](#setpartialstate): we _provide_ only a partial state (just for one line, say), but a _whole new state_ is re-created nonetheless.

So, what exactly do we need to do, and what options do we have besides [`setState`](#setstate) and [`setPartialState`](#setpartialstate)?

If we want to mark the third item as done, for instance, we have to replace the matching part of the state (and only that) with a _new object_ containing:

```ts
{
  description: "Third thing to do",
  isDone: true,
  timeEstimateInMn: 120,
}
```

If we just changed `isDone`, the object reference value would remain the same, `(state) => state[lineIndex]` would return the same value as before, and the `<EventLine>` wouldn't re-render.

OK, so how do we change just this object? We can do this in a [custom action](#custom-actions).

Custom actions have access to the whole `store`, and this includes the `store.state`.

We can use this to update only a small _part_ of the state, like so:

```ts
store.state[2] = {
  description: "Third thing to do",
  isDone: true,
  timeEstimateInMn: 120,
};
```

_(of course in real life we'd make the action [more generic](#updating-only-a-part-of-the-state-in-a-custom-action) than just changing the third line to a hard-coded value!)_

But, doing it this way, the subscribers are not notified of what you just did, so they won't react to the change immediately by re-rendering.

They _will_ get the latest value _when and if_ they next read this part of the state, but not on the spot.

If you wish to notify the subscribers that you've just made a change to a part of the state, and that they may have to re-render to take it into account, you need to call:

```ts
notifySubscribers();
```

See ["Updating only a part of the state in a custom action"](#updating-only-a-part-of-the-state-in-a-custom-action) for the actual implementation of a [custom action](#custom-actions) calling **notifySubscribers**.

# Mapped state (or "state slices")

Let's say your current state is:

```ts
{
  fieldOne: "one",
  fieldTwo: "two",
}
```

And you're going to need the value of `fieldOne` in `<ComponentA>`, and of `fieldTwo` in `<ComponentB>`.

If you do this:

```ts
const ComponentA = () => {
  const [{ fieldOne }, { setPartialState }] = useMySharedStore();
  // rest of the component code, where you'd use fieldOne
};

const ComponentB = () => {
  const [{ fieldTwo }, { setPartialState }] = useMySharedStore();
  // rest of the component code, where you'd use fieldTwo
};
```

It would sort of work, in that both `<ComponentA>` and `<ComponentB>` would indeed always have the latest value of `fieldOne` and `fieldTwo` to work with, respectively. But..

Now let's say that in `<ComponentB>` you do this at some point:

```ts
setPartialState({ fieldTwo: "four" });
```

`<ComponentB>` would re-render.. **but so would `<ComponentA>`** (see [`setPartialState`](#setpartialstate) for why).

Could we instead make it so that either component would only re-render if _**the part of the state they're actually interested in**_ changes?

It's possible with what we call **a `mapState` function**, which will return a **mapped state**.

Here's what it would look like for our components:

```ts
const ComponentA = () => {
  const [fieldOne, { setPartialState }] = useMySharedStore(
    (state) => state.fieldOne
  );
  // rest of the component code, where you'd use fieldOne
};

const ComponentB = () => {
  const [fieldTwo, { setPartialState }] = useMySharedStore(
    (state) => state.fieldTwo
  );
  // rest of the component code, where you'd use fieldTwo
};
```

Notice that we now write `fieldOne` instead of `{ fieldOne }` for instance, because _we now only receive the value of `fieldOne` back, not the whole state_, which we had to destructure `fieldOne` out of previously.

To do this, we've passed _a `mapState` function_ as an argument to `useMySharedStore`. Such a function receives (on each update) the whole state as an argument, and derives whatever value you want from it, which we call the _mapped state_ value.

- For subscribers _not_ using mapped states, re-renders happen if the whole _state_ value has changed after an update
- For subscribers which _are_ using mapped states, re-renders happen only if the _mapped state_ value has changed.

Here the mapped state is a _sub-state_, a part of the state itself, but _it doesn't have to be_, it could be anything, like the sum of two fields of the state object, for instance.

# Mapped state arrays (multiple state slices in the same call)

Let's say your current state is:

```ts
{
  fieldOne: "one",
  fieldTwo: "two",
  fieldThree: "three",
}
```

And you have a component that needs to subscribe to `fieldOne` and `fieldThree`, but doesn't care about `fieldTwo`.

As seen in the ["mapped state"](#mapped-state-or-state-slices) section above, if you do this:

```ts
const ComponentA = () => {
  const { fieldOne, fieldThree } = useMySharedStore(NoActions);
  // rest of the component code, where you'd use fieldOne and fieldThree
};
```

You _would_ get the latest values of `fieldOne` and `fieldThree`, but would also be re-rendered if `fieldTwo` is updated.

See ["State-only usage"](#state-only-usage) for the meaning of `NoActions`. You don't _have_ to use `NoActions` here, you could also have an array destructuring instead:

```ts
const ComponentA = () => {
  const [{ fieldOne, fieldThree }] = useMySharedStore();
  // rest of the component code, where you'd use fieldOne and fieldThree
};
```

If we try to apply what we've seen in the ["mapped state"](#mapped-state-or-state-slices) section, to make sure we're not re-rendered if `fieldTwo` is updated, we'd have to write something like this:

```ts
const ComponentA = () => {
  const fieldOne = useMySharedStore((state) => state.fieldOne, NoActions);
  const fieldThree = useMySharedStore((state) => state.fieldThree, NoActions);
  // rest of the component code, where you'd use fieldOne and fieldThree
};
```

_(notice that `NoActions` can either be [the first and only argument](#state-only-usage), or the second argument when a `mapState` function is provided as the first)_

Or this:

```ts
const ComponentA = () => {
  const [fieldOne] = useMySharedStore((state) => state.fieldOne);
  const [fieldThree] = useMySharedStore((state) => state.fieldThree);
  // rest of the component code, where you'd use fieldOne and fieldThree
};
```

To avoid the multiple hook calls, we can use what is called a **mapped state array**: we provide our different `mapState` functions in an array, and get back _an array of mapped state values_:

```ts
const ComponentA = () => {
  const [[fieldOne, fieldThree]] = useMySharedStore<[string, string]>([
    (state) => state.fieldOne,
    (state) => state.fieldThree,
  ]);
  // rest of the component code, where you'd use fieldOne and fieldThree
};
```

This is where `NoActions` comes in handy, to avoid the unsightly `[[..]]`:

```ts
const ComponentA = () => {
  const [fieldOne, fieldThree] = useMySharedStore<[string, string]>(
    [(state) => state.fieldOne, (state) => state.fieldThree],
    NoActions
  );
  // rest of the component code, where you'd use fieldOne and fieldThree
};
```

Or even better, provided we've prepared a `useMySharedStoreState` state-only hook in `useMySharedStore.ts`:

```ts
const ComponentA = () => {
  const [fieldOne, fieldThree] = useMySharedStoreState<[string, string]>([
    (state) => state.fieldOne,
    (state) => state.fieldThree,
  ]);
  // rest of the component code, where you'd use fieldOne and fieldThree
};
```

Now with this one call, we've made sure we'll be re-rendered if _either_ `fieldOne` or `fieldThree` changes (or both), but won't be bothered by changes to `fieldTwo`.

The one unfortunate effect of passing `mapState` functions in an array is that TypeScript is now no longer able to infer the types of the different mapped state values that will be returned - this is why you see `<[string, string]>` above: we have to tell it that `fieldOne` is a string, and so is `fieldThree`.

# Custom actions

The [actions](#a-few-definitions) you can call on a shared [store](#a-few-definitions) will always include the [default actions](#default-actions), and may also include **custom actions** if you provide them.

**Custom actions** are a group of functions that will have the `store` in their scope, and will be able to use it to:

- read from any part of the `store.state`
- use default actions to update the state
- call other custom actions if they need to
- do anything they wish, like performing an asynchronous network request, and then updating the state with the result

Any non-[state-only](#state-only-usage) component will have access to them, or to a [mapped version](#mapped-actions) of them.

Near the end of our [basic example](#a-basic-example-with-shared-store-hook), we had something like this:

```ts
const [isDarkMode, { setState: setIsDarkMode }] = useDarkMode();
```

Now say we'd like our site to _remember_ the state of the dark mode between visits? We could save it in `localStorage`, or whatever, the important part is: we don't want to _just_ change `isDarkMode`, but do something else at the same time.

Instead of just calling `setState` renamed to `setIsDarkMode`, we'd call something like `setAndSaveDarkMode`:

```ts
const [isDarkMode, { setAndSaveDarkMode }] = useDarkMode();
```

This new action could look something like this:

```ts
const setAndSaveDarkMode = (newIsDarkMode: boolean) => {
  // do something to persist this value, then
  setState(newIsDarkMode);
};
```

So it would also need to have access to `setState` somehow.

To do this, we will need to provide our custom action at **store creation time**, that is when we call `createSharedStoreHook` (see [here](#a-basic-example-with-shared-store-hook)).

The custom actions need to be provided in the form of a function, that receives the `store` and returns an object, which keys are the name of the actions, and values are functions.

These functions will therefore have the `store` in their scope. This `store` object will hold the `state`, plus all the [default actions](#default-actions) (see [here](#whats-in-store-for-the-custom-actions)).

So we could write something like this:

```ts
const actions = (store: SharedStore<boolean>) => ({
  setAndSaveDarkMode: (newIsDarkMode: boolean) => {
    // do something to persist this value, then
    store.setState(newIsDarkMode);
  },
});
```

Above, `SharedStore` is a generic type we need to import:

```ts
import { createSharedStoreHook, SharedStore } from "shared-store-hook";
```

And `boolean` is a type that describes the shape of our entire state. Here it is trivial, but it could be a complex type, in which case we'd describe it in a named interface (see below).

So now that we've got our `actions` ready, we just have to pass them at store creation time:

```ts
export const useDarkMode = createSharedStoreHook<boolean, typeof actions>(
  React,
  { actions }
);
```

Or, if we want to be more explicit:

```ts
type DarkModeActions = typeof actions;

export const useDarkMode = createSharedStoreHook<boolean, DarkModeActions>(
  React,
  { actions }
);
```

And we should also provide an [`initialState`](#initial-state) alongside the actions:

```ts
export const useDarkMode = createSharedStoreHook<boolean, DarkModeActions>(
  React,
  { actions, initialState: false }
);
```

But now it would make more sense for our `initialState` to retrieve the value that was stored by `setAndSaveDarkMode`:

```ts
const initialState: boolean = retrieveSavedValue(); // whatever this does

export const useDarkMode = createSharedStoreHook<boolean, DarkModeActions>(
  React,
  { actions, initialState }
);
```

Finally, as we set out to do, we can do this:

```ts
const [isDarkMode, darkModeActions] = useDarkMode();

// turn on dark mode and "remember" it for our next visit
darkModeActions.setAndSaveDarkMode(true);
```

Note that, in our example, what we provide in `actions` at store creation time and what we get in `darkModeActions` at hook call time is _not exactly the same thing_.

The [default actions](#default-actions) are added of course, but also `actions` is a _function_ that returns an _object_ of functions, and `darkModeActions` is _that returned object of functions, plus default actions_.

Schematically:

```ts
actions = (store) => ({ setAndSaveDarkMode: () => {} });
darkModeActions = { setAndSaveDarkMode: () => {}, setState: .. };
```

## What's in `store` for the custom actions?

When you have this:

```ts
const actions = (store: SharedStore<MyState>) => ({
  myAction: () => {
    // do something
  },
});

type MyActions = typeof actions;

export const useMySharedStore = createSharedStoreHook<MyState, MyActions>(
  React,
  { actions }
);
```

What can you actually _do_ in `myAction`?

Well it has access to `store`, and in it you will find the **state** and the [default actions](#default-actions), like so:

- store.[forceRerenderSubscribers](#forcererendersubscribers)
- store.[notifySubscribers](#notifysubscribers)
- store.[resetState](#resetstate)
- store.[setPartialState](#setpartialstate)
- store.[setState](#setstate)
- store.state

_(it also has access to the [other custom actions](#calling-a-custom-action-within-a-custom-action))_

So in a custom action you could, for instance:

- call `store.setPartialState` to update the state according to the current state in `store.state` and different arguments you provide to your action.
- [set a part of the state](#updating-only-a-part-of-the-state-in-a-custom-action) using data you fetch from an external API.
- just _return_ parts of `store.state`. Why not _subscribe_ to these parts instead? Because then you'd be re-rendered when they're updated, and you may just need to _read_ a piece of state _at some given time_ - following the click of a button, for instance.
- ..

## Be careful with `store.state`

Custom actions all have access to `store.state` to read from it, but nothing prevents them from also **writing** to it, be it by re-assigning it completely, with `store.state = ..`, or just parts of it, like `store.state[3] = ..`.

But updating the state by changing the value of `store.state` in a custom action is not recommended, _**as it won't notify the subscribers**_. You should use [`setState`](#setstate) or [`setPartialState`](#setPartialState) for this.

That being said, there _are_ a few edge cases where tweaking `store.state` directly is actually what you want, to prevent re-renders. Then you need **store.[notifySubscribers](#notifysubscribers)** to broadcast your changes. Keep reading below for details of this special use case.

## Updating only a part of the state in a custom action

Getting back to the example at the end of the [`notifySubscribers`](#notifysubscribers) section, it would be nice to be able to do this for the checkbox in each `<TodoLine>`:

```ts
onChange={() => { todoActions.toggleItemStatus({ lineIndex }); }}
```

And that _only_ the `<TodoLine>` at this `lineIndex` be re-rendered.

If we try this custom action:

```ts
interface TodoItem {
  description: string;
  isDone: boolean;
  timeEstimateInMn: number;
}

type TodoState = Array<TodoItem>;

const actions = (store: SharedStore<TodoState>) => ({
  toggleItemStatus: ({ lineIndex }: { lineIndex: number }) => {
    store.setPartialState({
      [lineIndex]: {
        ...store.state[lineIndex],
        isDone: !store.state[lineIndex].isDone,
      },
    });
  },
});
```

It _would_ toggle our boolean, but also **re-render _all_ the existing lines**, because it would be creating [a whole new state](#setpartialstate) on each update.

What we need to do is just _change the part of `store.state` we want to change ourselves_:

```ts
const actions = (store: SharedStore<TodoState>) => ({
  toggleItemStatus: ({ lineIndex }: { lineIndex: number }) => {
    store.state[lineIndex] = {
      ...store.state[lineIndex],
      isDone: !store.state[lineIndex].isDone,
    };

    // but something's missing!
  },
});
```

But that's not enough, as seen in the [`notifySubscribers`](#notifysubscribers) section: we've changed a part of the state, but the subscribers are not made aware of it.

So we need this:

```ts
const actions = (store: SharedStore<TodoState>) => ({
  toggleItemStatus: ({ lineIndex }: { lineIndex: number }) => {
    store.state[lineIndex] = {
      ...store.state[lineIndex],
      isDone: !store.state[lineIndex].isDone,
    };

    store.notifySubscribers(); // that's better!
  },
});
```

Now every subscriber will be notified that something has changed, and, depending on whether they're interested in that piece of state or not, may re-render to take the new value into account.

And we should also provide an [`initialState`](#initial-state) alongside the actions:

```ts
export const useTodoList = createSharedStoreHook<TodoState, TodoActions>(
  React,
  { actions, initialState: [] }
);
```

or:

```ts
const initialState: TodoState = [];

export const useTodoList = createSharedStoreHook<TodoState, TodoActions>(
  React,
  { actions, initialState }
);
```

## Calling a custom action within a custom action

If you ever need to call a custom action within another custom action, here's how you do it:

```ts
const actions = (store: SharedStore<MyState>) => ({
  firstAction: () => {
    // do something
  },

  secondAction: () => {
    // do something else first, then
    actions(store).firstAction();
  },
});
```

# Mapped actions

What are **mapped actions**? They're a bit like [mapped state](#mapped-state-or-state-slices), but for [**actions**](#a-few-definitions) &#x1f609;

You might never need them, as everything you need to do with a store could be expressed by [custom actions](#custom-actions).

But it could also happen that the actions you need to perform are so _specific_ to a given component, that they shouldn't really be in the store's _generic_ custom actions, as no other component using the store will need them.

Or that you inherit the custom actions from somewhere else, and can't change them yourself for some reason.

Starting from the last example from the previous section, if we had:

```ts
export const useTodoList = createSharedStoreHook<TodoState, TodoActions>(
  React,
  { actions, initialState }
);
```

And then in one calling component:

```ts
export const TodoList = () => {
  const todoActions = useTodoList(ActionsOnly);

  // ... and later ...

  if (someCondition) {
    todoActions.firstAction();
  } else {
    todoActions.secondAction();
  }

  // ... and later still, the same thing ...

  if (someCondition) {
    todoActions.firstAction();
  } else {
    todoActions.secondAction();
  }
```

_(see ["Actions-only usage"](#actions-only-usage) for `ActionsOnly`)_

Then we could use **a `mapActions` function**, that returns one or several **mapped actions** derived from the store's actions, like so:

```ts
export const TodoList = () => {
  const actionOnCondition = useTodoList(
    ActionsOnly, // we don't need the state, but will map the actions:
    (actions) => (someCondition) =>
      someCondition ? actions.firstAction() : actions.secondAction()
  );

  // ... and later ...

  actionOnCondition(someCondition);

  // ... and later still, the same thing ...

  actionOnCondition(someCondition);
```

As you can see, the `mapActions` function has to be the _second argument_ to our custom hook call. In the first slot, we can either have:

- [`ActionsOnly`](#actions-only-usage) if we don't need the state
- a [`mapState` function](#mapped-state-or-state-slices)
- a [`mapStateArray` of functions](#mapped-state-arrays-multiple-state-slices-in-the-same-call)
- `undefined`, in which case we just get the whole unmapped state back, alongside the mapped actions:

```ts
export const TodoList = () => {
  const [todoState, actionOnCondition] = useTodoList(undefined, /* mapActions function here */);
```

Just like with `mapState`, the return of the `mapActions` function doesn't _have_ to be a subset of the `actions`.

It can be whatever you want, derived from the `store`'s `state`, its `actions`, or any combination of the two.

# Unmount safety

When a component is using a shared piece of state that several _other_ components may update at any time, it means that this component may be asked to _update its state_ at any time.

Including at a time when it shouldn't be asked to do so: when it has just unmounted.

Trying to update the state of an unmounted component **triggers a React warning**:

> Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.

Of course, the unmount removes the component from the list(s) of subscribers of the shared state(s) it was using, but this is not enough to prevent a race condition if an update occurs around the _exact moment_ the unmount is triggered.

This is why `shared-store-hook` **checks for this particular condition**: an unmounting component is flagged as such, so that if any update to a piece of shared state it was using happens between the beginning of the unmount and the moment the component is unregistered from the subscribers, _it will be ignored_.

Therefore, `shared-store-hook` is **unmount-safe**, unlike many similar libraries! &#x1f609;

# Why use this lib and not X or Y?

## Why not use Redux, Context, prop-drilling, ..?

### Redux

You probably don't need Redux, most projects don't.

It's large, does many things you probably don't need - or _do_ need but in a way too complex manner (thunks, anyone?) - and forces you to write a whole lot of boilerplate code.

Contrast it with the simplicity of `useState` and you just have to ask yourself: why?

The only thing `useState` is really missing, for most of us, is the "sharing" part - you shouldn't have to create a whole new world and force people up quite a steep learning curve to add just _that_, should you?

Nope. Adding the "sharing" part to `useState` is just what this lib does - and much more, in about 100 lines of code. And it feels (almost) just as familiar as using `useState`.

### Prop-drilling

Prop-drilling refers to the practice of passing props down the component chain through several "layers" until you reach the component(s) that actually _need_ said props. Most components along the way just received props they don't need from their parent, and passed them down. To components that might not need them either, but will pass them down to components that do.

Needless to say this is neither efficient nor elegant. Plus it creates strong coupling between your components: moving the intermediate "layers" around or using them somewhere else becomes quite difficult.

It's of course OK to pass props down to components that will actually _use_ them. And it can even be acceptable to "drill" just two levels down, say. But if you find yourself passing props down a very long chain of components, just for the "bottom" ones to consume, you're probably doing something wrong.

What you need is for the components that need the data you're passing _to fetch them themselves instead_.

Context gives you the illusion of doing that (see below), but a lib like `shared-store-hook` _actually_ does it.

### Context

The [doc](https://reactjs.org/docs/context.html) for React Context says that:

> Context provides a way to pass data through the component tree without having to pass props down manually at every level.

This sounds great, but as the doc also says:

> Context is primarily used when some data needs to be accessible by many components at different nesting levels. Apply it sparingly because it makes component reuse more difficult.

So, just like with prop-drilling, component reuse becomes an issue with Context.

Note the _"many components at different _**nesting**_ levels"_: what if you want to share data between components that are _not_ in the same tree? With Context, you can't. Or you'd need to place your Context "above" the common ancestor of all the subtrees that need it - again, coupling.

Context is just like prop drilling, but it _implicitly_ drills the props down for you, instead of your having to explicitly do it. It could have its uses, but you're almost always better off with shared states.

`shared-store-hook` can be used whenever _"some data needs to be accessible by many components"_ - period. Drop the nesting and coupling parts. The "many components" may be anywhere in the app, they don't need to share any tree structure. They don't impose anything on their "parent" components, which don't need to have anything to do with the shared stores - but they can use them as well if they need, of course.

Saying there's _zero_ coupling would of course be inaccurate: any subscriber of a shared store _is coupled to that shared store_. But that's weak coupling, just like requesting a lib from `node_modules`: it doesn't prevent you from moving your component around anywhere in the app (especially if you use a [base URL](https://www.typescriptlang.org/docs/handbook/module-resolution.html#base-url), allowing you to import from, say, `"state/useDarkMode"` instead of from a relative path).

## Why not use other non-Redux shared state libs?

There are other light, non-Redux shared state libs out there, what makes this one different?

### It's got extra smarts that other libraries are missing

For instance, [it doesn't try to update a component that has just been unmounted](#unmount-safety), as most other libs do (this causes a React warning, as you might expect).

As some other libs do, it allows your components to be re-rendered [only if _part_ of the state has changed](#mapped-state-or-state-slices), but it also adds the possibility for any component to subscribe to [_multiple parts_ of the same state in a single call, and be re-rendered if _any_ of these parts change](#mapped-state-arrays-multiple-state-slices-in-the-same-call).

In addition, you can easily say that some components will only use the [**actions**](#a-few-definitions) from a store, so that they can read from or write to the state, but [won't be re-rendered if any of it changes](#actions-only-usage).

You can define [custom actions](#custom-actions) for every user of the store to use, or even [derive special actions](#mapped-actions) from those in a single component. And every single action will be fully typed, just like every piece of state.

It also adds other [default actions](#default-actions) to any [**store**](#a-few-definitions). In other libs you have to write [custom actions](#custom-actions) to do what [`setState`](#setState), [`setPartialState`](#setpartialstate) or [`resetState`](#resetstate) do, for instance - with `shared-store-hook` batteries are included, you're ready to go.

### It feels more "React-y"

This lib makes use of what's already present in React, namely `useState`, and just makes the state and the "setState" action it returns ([and](#default-actions) [more](#custom-actions)) available to several components instead of one.

Just like with `useState`, your shared state can be as simple as a boolean or as complex as a multi-level object.

Just like with `useState`, you can have as many _shared_ states as you want, they're all independent. You don't stuff everything into one massive shared state, but group together whatever pieces of information should remain together.

Unlike `useState`, however, the state is _shared_: when one piece of state is updated, every component that [has "subscribed" to that piece of state](#mapped-state-or-state-slices) (not as complicated as it sounds, see examples) is re-rendered.

And you can of course continue to use `useState` along shared states for "private" state that only one component should care about.

Some of those other libs also differ too much from `useState`:

- they lack some features, like [being able to pass in a _function_ when updating the state](https://reactjs.org/docs/hooks-reference.html#functional-updates)
- they don't compare the previous and updated states with [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is#description), [like `useState` does](https://reactjs.org/docs/hooks-reference.html#bailing-out-of-a-state-update)
- their `setState` behaves like the `setState` method found in class components: they automatically merge update objects instead of updating the whole state. This lib provides both `setState` (same behaviour as `useState`'s `setState`) and `setPartialState` (same behaviour as class components' `setState`) - see [default actions](#default-actions).

And even though this library sports "advanced" features, its basic usage remains almost as simple as a `useState` one-liner - see [basic example](#a-basic-example-with-shared-store-hook).

# Compatible React versions

This library uses React hooks (who doesn't nowadays?), so you need at least React v16.8.

It doesn't have any React peer dependency with a specific version number, as some installers may complain that the bleeding edge version you're using is too recent for the lib! ;)

The lib will remain compatible with future major versions of React as long as the behaviours of `useState`, `useEffect` and `useMemo` don't change.

Specifically, in order not to throw an exception at runtime, its _minimum_ expectations are that:

- `useEffect` and `useMemo` are callable, accept a function as a first argument, and call that function
- `useState` is callable, and returns an array, of which the second element is callable

As long as this doesn't change in React, the lib won't die on you!

Of course not dying is the least it can do, so in order to actually _work_, the behaviour of these standard hooks has to remain unchanged from what they were for v16.8 (so far so good).

# Use in JavaScript instead of TypeScript

This lib was written entirely in **TypeScript**, but you can use it in vanilla **JavaScript** as well.

Just _remove_ all mentions of types, interfaces, type annotations, and you're good to go.

For instance, this in TypeScript:

```ts
interface usePreferencesState {
  isDarkMode: boolean;
  language: "en" | "fr" | "uk";
}

const initialState: usePreferencesState = {
  isDarkMode: true,
  language: "en",
};

export const usePreferences = createSharedStoreHook<usePreferencesState>(
  React,
  { initialState }
);
```

Becomes this in JavaScript:

```js
const initialState = {
  isDarkMode: true,
  language: "en",
};

export const usePreferences = createSharedStoreHook(React, { initialState });
```

Of course you loose type safety, some code completion, and all of the other goodness of TypeScript - but it will work nonetheless.

But please do consider using TypeScript instead! &#x1f609;

# Credit

This library was inspired by [use-global-hook](https://www.npmjs.com/package/use-global-hook) and, at its core, uses the same basic idea.

But `use-global-hook` had a few bugs, was missing some features, and was written in JS, not TS.

Types were available from DefinitelyTyped, but these were incorrect and incomplete.

This was written in TypeScript from the get-go, with special attention to type correctness and completeness.
