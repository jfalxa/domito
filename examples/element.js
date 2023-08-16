import { $ } from "../src/reactive";
import { element, $text } from "../src/dom";

/* --------------------------------------------------
  1. Basic DOM element creation
 -------------------------------------------------- */

// Create a div
const div = element("div");

/* --------------------------------------------------
  2. DOM element creation with text content
 -------------------------------------------------- */

// Create a div with some text inside
const divWithText = element("div", "Some text inside");

/* --------------------------------------------------
  3. DOM element creation with init callback
 -------------------------------------------------- */

// Create a div and set its properties and attributes
// The callback function takes the created HTMLDivElement as its only argument
const divWithInit = element("div", (div) => {
  div.id = "complex-div";
  div.style.fontWeight = "bold";
  div.classList.add("some-css-class");
  div.onclick = () => console.log("div was clicked");

  // you can directly append the returned value of the element() function
  // as it is just a regular HTMLElement
  div.append(
    element("h1", "Some title"), //
    element("p", "Some paragraph with a description.")
  );
});

/* --------------------------------------------------
  4. Existing DOM element modification
 -------------------------------------------------- */

// Grab an existing element from the DOM
const root = /** @type {HTMLDivElement} */ (document.getElementById("root"));

// Apply some changes to it
const rootWithText = element(root, (root) => {
  root.classList.add("some-css-class");
});

/* --------------------------------------------------
  5. Reactive DOM updates
 -------------------------------------------------- */

// Setup a signal with a toggle value
const $toggle = $(false);

// Create a checkbox that updates its checked prop based on a signal
const checkbox = element("input", (input) => {
  input.type = "checkbox";

  // you can setup an effect that tracks a signal and updates the DOM
  $(() => {
    // here, the checked prop of the input will be bound to the value of $toggle
    input.checked = $toggle.value;
  });
});

/* --------------------------------------------------
  6. Reactive DOM updates
 -------------------------------------------------- */

// Setup a signal with some text
const $message = $("Hallo");

// Create a div with a reactive content
const divWithReactiveContent = element("div", (div) => {
  div.append(
    $text(() => $message.value) // $text will automatically update its textContent based on $message
  );
});
