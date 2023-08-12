// import * as reactive from "./domito/reactive";
// import * as dom from "./domito/dom";
// import * as async from "./domito/async";
// console.log({ reactive, dom, async });

import { $, $scope, $async, Signal, Async } from "./reactive/index.js";
import { element, render, onConnected, onDisconnected } from "./dom/index.js";
import { $text, $when, $list, $map } from "./dom/index.js";
import { Supervisor } from "./reactive/supervisor.js";
import { debug } from "./reactive/debug.js";

// @ts-ignore
window.Supervisor = Supervisor;

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

  // test cycle detection
  const $sourceA = $(0);
  const $sourceB = $("1");

  try {
    $(() => ($sourceB.value += $sourceA.value));
    $(() => ($sourceA.value = $sourceB.value.length));
  } catch (error) {
    console.error(error);
    $sourceA.dispose();
    $sourceB.dispose();
  }

  const $counter = $(1);

  const $waitFor = $(0);

  $(() => {
    $waitFor.value = $items.value.length * 100;
  });

  const $timed = $async((waitFor, counter) => sleep(waitFor * counter), {
    arguments: () => [$waitFor.value, $counter.value],
  });

  const $a = $("a");
  const $b = $("b");
  const $c = $("c");

  $(() => {
    $c.value = $c.value + $a.value + $b.value;
  });

  const $d = $(() => $c.value + $a.value);

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
      console.log("Loading...", $items.value.length);
    } else if ($timed.error) {
      console.log("Error:", $timed.error.message);
    } else if ($timed.data) {
      console.log("Success:", $timed.data);
    }
  });

  return element("main", (main) => {
    main.append(
      element("button", (button) => {
        button.textContent = "Add a number";
        button.onclick = () => {
          $items.value = [...$items.value, $items.value.length + 1];
        };
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
        button.onclick = () => $timed.run(200, 2.5);
        $(() => (button.disabled = $timed.loading));
      }),

      $when($hasReachedTen, () =>
        element("div", (div) => {
          const onResize = () => console.log("resize!");
          const onScroll = () => console.log("scroll!");

          onConnected(() => {
            document.body.style.height = "10000vh";
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
 *  $timed: Async<Date, [number, number]>;
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
                $list($items, ($item) =>
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
