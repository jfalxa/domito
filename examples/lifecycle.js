import { render, element, onConnected, onDisconnected } from "../src/dom";

/* --------------------------------------------------
  1. Create an element with lifecycle hooks
 -------------------------------------------------- */

function Main() {
  // create a main element and add a connected and disconnected callback to it
  return element("main", (main) => {
    function handleClick() {
      console.log("click");
    }

    // The onConnected and onDisconnected hooks will be detected only if the render() function was used.
    // They are then available on any descendant element created with the element() function

    onConnected(() => {
      console.log("main element has been connected to the DOM");
      main.addEventListener("click", handleClick);
    });

    onDisconnected(() => {
      console.log("main element has been disconnected from the DOM");
      main.removeEventListener("click", handleClick);
    });

    main.append(
      element("h1", (h1) => {
        h1.textContent = "Title";

        onConnected(() => console.log("Title was mounted"));
        onDisconnected(() => console.log("Title was removed"));
      })
    );
  });
}

/* --------------------------------------------------
  2. Render an element to trigger lifecycle hooks
 -------------------------------------------------- */

// get the root element you want to see Main at
const root = document.getElementById("root");

// create Main and render it inside root.
if (root) render(root, Main);
