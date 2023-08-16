import { $, $scope } from "../src/reactive";

/* --------------------------------------------------
  1. Basic signal
 -------------------------------------------------- */

// Create a reactive signal with an initial value of 0
const $counter = $(0); // the value can be any javascript value, except a function

// Log value: 0
console.log($counter.value);

/* --------------------------------------------------
  2. Basic effect
 -------------------------------------------------- */

// Create an effect that automatically logs $counter when it changes.
// To define a reactive effect, pass a function that returns nothing (or undefined) to the $ function.
// The effect function will be called as soon as the effect is created.
// Consuming a signal's value inside this function will automatically subscribe the effect to the signal.
$(() => {
  // this effect will be automatically bound to $counter because we read $counter.value
  console.log("$counter value is", $counter.value);
});

// Update $counter = 100
$counter.value = 100;

// => The previous operation will trigger the effect and it will log "100"

/* --------------------------------------------------
  3. Derived effect
 -------------------------------------------------- */

// Create a derived value = $counter * 2
const $doubled = $(() => $counter.value * 2);

// => The same reactivity rules as regular effects apply to derived values
// The only difference between a basic effect and a derived effect is that the derived effect function returns a value
// If the effect function doesn't have a return statement, or explicitely returns undefined it will be considered as a basic effect.

// Log value: 200
console.log($doubled.value);

try {
  // A derived value cannot be modified
  $doubled.value = 4;
} catch (error) {
  // Log error: "Effect values are read-only"
  console.error(error);
}

// Update $counter = 1
$counter.value = 1;

// => The previous operation will trigger the effect and also recompute $doubled

// Log value: 2
console.log($doubled.value);

/* --------------------------------------------------
  4. Nested derived effects
 -------------------------------------------------- */

// Derived values can also be derived, and be reactive as well
const $quadrupled = $(() => $doubled.value * 2);

// Log value: 4
console.log($quadrupled.value);

// Update $counter = 2
$counter.value = 2;

// Log value: 8
console.log($quadrupled.value);

/* --------------------------------------------------
  5. Reactive scope
 -------------------------------------------------- */

// Create a reactive scope
const scope = $scope(() => {
  // All the signals and effects created inside will be bound to this scope

  const $a = $(0);
  const $b = $(() => $a.value.toString());

  $(() => {
    console.log($a.value, $b.value);
  });
});

// Dispose of the scope
scope.dispose();

// => The previous operation removed $a, $b and their subscriber effect all at once.
