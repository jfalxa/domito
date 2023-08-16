import { $, $async } from "../src/reactive";

// Define a function that returns a Promise that resolves after the specified duration
function sleep(/** @type {number} */ duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/* --------------------------------------------------
  1. Basic async effect
 -------------------------------------------------- */

// Create an async effect that waits 1000ms when triggered
const $wait1000 = $async(() => sleep(1000));

// Create an effect that will log when $wait1000 has started and finished its operation
$(() => {
  if ($wait1000.loading) {
    console.log("$wait1000: wait 1000s");
  } else {
    console.log("$wait1000: idle");
  }
});

// Start waiting
await $wait1000.run();

// => The previous operation will trigger the effect 2 times, once sleep starts, and then once it's done

/* --------------------------------------------------
  2. Async effect with a value
 -------------------------------------------------- */

// Create an async effect that produces a value when it's done
const $waitAndGetDate = $async(() => sleep(1000).then(() => new Date()), {
  initialValue: new Date(0), // you can optionnaly specify an initial value
});

// Create an effect that will log when $waitAndGetDate is done and its date value created
$(() => {
  if ($waitAndGetDate.value) {
    console.log("$waitAndGetDate: value =", $waitAndGetDate.value.toLocaleString());
  }
});

// Run the $waitAndGetDate effect
const waitAndGetDateResult = await $waitAndGetDate.run();

// The new result is also the value of $waitAndGetDate
console.log("$waitAndGetDate: is equal to result?", $waitAndGetDate.value === waitAndGetDateResult);

/* --------------------------------------------------
  3. Async effect with parameters
 -------------------------------------------------- */

// Create an async effect with parameters
const $waitN = $async((duration, multiplier) => sleep(duration * multiplier));

// Run the async effect with arbitrary arguments
await $waitN.run(200, 10);

// => The previous operation will wait for 2000ms

/* --------------------------------------------------
  4. Automatic async effect with reactive arguments
 -------------------------------------------------- */

// Setup two signals
const $duration = $(0);
const $multiplier = $(0);

// Create an automatic async effect with reactive parameters
// Specifying an argument parameter makes the call to the async task reactive
// it will be called automatically any time any of the specified dependencies change
const $waitAuto = $async(
  (duration, multiplier) => sleep(duration).then(() => Math.random() * multiplier),
  { arguments: () => [$duration.value, $multiplier.value] }
);

$(() => {
  if ($waitAuto.loading) {
    console.log("$waitAuto: wait triggered");
  } else if ($waitAuto.value !== null) {
    console.log("$waitAuto: value =", $waitAuto.value);
  }
});

// update the reactive arguments
$duration.value = 1000;
$multiplier.value = 10;

// => The previous updates will automatically trigger a new run of $waitAuto, using the new values of the signals as arguments
// That way $waitAuto will run automatically every time the signals change

/* --------------------------------------------------
  5. Error handling
 -------------------------------------------------- */

// Create an async effect that throws
const $waitError = $async(() => {
  throw new Error("Can't wait");
});

// The error is now accessible as part of the $waitError async effect
$(() => {
  if ($waitError.error) {
    console.log("$waitError: error =", $waitError.error.message);
  }
});

// Run the error effect, the error will be caught
await $waitError.run();

/* --------------------------------------------------
  6. Lifecycle callbacks
 -------------------------------------------------- */

// Create an async effect with lifecycle callbacks
const $waitHooked = $async(() => sleep(1000).then(() => "ok"), {
  onLoad: () => console.log("$waitHooked: loading"),
  onError: (error) => console.log("$waitHooked: error =", error.message),
  onSuccess: (data) => console.log("$waitHooked: value =", data),
});

// Run the effect and watch the callbacks log information
$waitHooked.run();
