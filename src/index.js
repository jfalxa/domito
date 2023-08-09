// import * as reactive from "./domito/reactive";
// import * as dom from "./domito/dom";
// import * as async from "./domito/async";
// console.log({ reactive, dom, async });

import $, { $scope, Signal } from "./domito/reactive.js";
import $async, { Async } from "./domito/async.js";
import debug from "./domito/debug.js";
import {
  render,
  element,
  $text,
  $when,
  $index,
  $map,
  onConnected,
  onDisconnected,
} from "./domito/dom.js";

/**
 * @param {number} duration
 * @returns {Promise<Date>}
 */
function sleep(duration) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (Math.random() > 0.2) resolve(new Date());
      else reject(new Error("Random error"));
    }, duration)
  );
}

function Main() {
  const $items = $([1, 2, 3, 4]);
  const $modulo6 = $(() => $items.value.length % 6);
  const $hasReachedTen = () => $items.value.length >= 10;

  const $waitFor = $(0);
  const $timed = $async(() => sleep($waitFor.value));

  const $mutable = $((/** @type {number[] | undefined} */ mutable) => {
    // initialize object on first run
    if (!mutable) return [$items.value.length];
    // mutate initial object on next runs
    else mutable.push($items.value.length);
  });

  $(() => {
    console.log("mutable length =", $mutable.value.length);
  });

  setTimeout(() => {
    $mutable.mutate((mutable) => mutable.push(2000));
  }, 2000);

  $(() => {
    if ($timed.loading) {
      console.log("Loading...", $waitFor.value);
    } else if ($timed.error) {
      console.log("Error:", $timed.error.message);
    } else if ($timed.data) {
      console.log("Success:", $timed.data);
    }
  });

  $(() => {
    $waitFor.value = $items.value.length * 100;
  });

  return element("main", (main) => {
    main.append(
      element("button", (button) => {
        button.textContent = "Add a number";
        button.onclick = () => ($items.value = [...$items.value, $items.value.length + 1]);
      }),

      element("button", (button) => {
        button.textContent = "Remove a number";
        button.onclick = () => ($items.value = $items.value.slice(0, -1));
      }),

      element("b", (b) => {
        b.id = "muy";
        b.textContent = "SI MUY";
      }),

      element("button", (button) => {
        button.textContent = "Start async";
        button.onclick = () => $timed.run();
        $(() => (button.disabled = $timed.loading));
      }),

      $when($hasReachedTen, () =>
        element("div", (div) => {
          const onResize = () => console.log("resize!");
          const onScroll = () => console.log("scroll!");

          onConnected(() => {
            document.body.style.height = "300vh";
            window.onscroll = onScroll;
            window.onresize = onResize;
          });

          onDisconnected(() => {
            document.body.style.removeProperty("height");
            document.getElementById("muy")?.remove();
            window.onscroll = null;
            window.onresize = null;
          });

          div.append(element("h1", "THERE ARE AT LEAST TEN NUMBERS"));
        })
      ),

      Items({ $items, $modulo6, $timed })
    );
  });
}

/**
 * @param {{
 *  $items: Signal<number[]>;
 *  $modulo6: Signal<number>;
 *  $timed: Async<() => Promise<Date>>;
 * }} props
 */
function Items({ $items, $modulo6, $timed }) {
  return element("ul", (ul) => {
    ul.append(
      $map($items, (item) =>
        element("li", (li) => {
          li.append(
            element("span", `List item #${item}`),

            $when($modulo6, () =>
              element("b", (b) => {
                onDisconnected(() => {
                  console.log("CIACIAO");
                });

                b.append($text(() => `NOT A MULTIPLE OF 6 (-${6 - $items.value.length})`));
              })
            ),

            $when($timed.isLoading, () => element("h1", "Loading...")),

            $when($timed.hasError, () =>
              element("h1", (h1) => {
                h1.style.color = "red";
                h1.append($text(() => $timed.error?.message));
              })
            ),

            $when($timed.hasData, () =>
              element("h1", (h1) => {
                h1.style.color = "green";
                h1.append($text(() => $timed.data?.toLocaleString()));
              })
            ),

            element("ul", (ul) => {
              ul.append(
                $index($items, ($item) =>
                  element("li", (li) => {
                    li.append($text(() => `List subitem #${$item.value * 2}`));
                  })
                )
              );
            })
          );
        })
      )
    );
  });
}

const scope = $scope(() => {
  const root = /** @type {HTMLElement} */ (document.getElementById("root"));
  render(root, Main);
});

// @ts-ignore
window.debug = () => debug(scope);
