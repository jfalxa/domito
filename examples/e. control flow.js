import { $ } from "../src/reactive";
import { element, $if, $list as $list, $map, $text } from "../src/dom";

/* --------------------------------------------------
  1. Use $if to conditionnaly render a DOM element
 -------------------------------------------------- */

// Create a toggleable signal
const $toggle = $(true);
const $notToggle = () => !$toggle.value; // you can create light derived signals with a function

// Create a div that displays a green or red title depending on the value of $toggle
const div = element("div", (div) => {
  div.append(
    // this h1 will be shown only when $toggle is true
    $if($toggle, () =>
      element("h1", (h1) => {
        h1.textContent = "Toggle is ON";
        h1.style.color = "green";
      })
    ),

    // this h1 will be shown only when $toggle is false
    $if($notToggle, () =>
      element("h1", (h1) => {
        h1.textContent = "Toggle is OFF";
        h1.style.color = "red";
      })
    )
  );
});

/* --------------------------------------------------
  2. Map items to DOM elements
 -------------------------------------------------- */

// Create an array signal
const $items = $([14, 32, 24, 72, 51]);

// create a list and append lis that will be linked with each value in $items
// as $map uses the item value as key for each li, the values inside $items should all be unique
const ulWithMap = element("ul", (ul) => {
  ul.append(
    // use $map to create one li linked to each value in $items
    $map($items, (item, $index) =>
      element("li", (li) => {
        li.append(
          $text(() => `${$index.value}/`), // as the li can be moved around according to the position of item in $items, the index is a reactive property
          `item with value ${item}` // the item itself however stays the same as it is used to identify this li
        );
      })
    )
  );
});

// mutate the $items array by reversing it
$items.mutate((items) => {
  items.reverse();
});

// => The previous operation triggers an effect inside the $map callback
// as the values themselves did not change, the already existing DOM nodes will be reorganized to match the new $items order
// and as their index are signals, they will update the content of the lis to match the new item position in $items

/* --------------------------------------------------
  3. List items by their position in a collection
 -------------------------------------------------- */

// create a list and append lis that will be linked to each index of the list
// as only the index is used to identify lis, $items can have duplicates without causing problems
const ulWithList = element("ul", (ul) => {
  ul.append(
    // use $list to create one li linked to each position/index in $items
    $list($items, ($item, index) =>
      element("li", (li) => {
        li.append(
          `${index}/`, // the li is identified by its index in the list, so the index value will never change
          $text(() => `item with value ${$item.value}`) // as the item at this index can change depending on the order of $items, $item is a reactive property
        );
      })
    )
  );
});

// mutate the $items array by reversing it
$items.mutate((items) => {
  items.reverse();
});

// => The previous operation triggers an effect inside $index
// as the values on each given position have changed, the li elements will see their content updated
// so that they use the value of the new items matching their position in the list
