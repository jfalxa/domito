export class Splitter extends HTMLElement {
  private _siblingFrames: HTMLElement[] | undefined;
  private _initialPosition: number | undefined;
  private _initialSiblingFlex: Map<HTMLElement, number> | undefined;
  private _flexPerPixel: number | undefined;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get direction() {
    if (!this.parentElement) throw new Error('divider can only be used inside flex containers') // prettier-ignore
    const style = getComputedStyle(this.parentElement);
    if (style.display !== "flex") throw new Error('divider can only be used inside flex containers') // prettier-ignore
    return style.flexDirection;
  }

  connectedCallback() {
    const style = document.createElement("style");
    this.shadowRoot!.append(style);

    style.sheet!.insertRule(":host { background-color: black; align-self: stretch; }");

    if (this.direction === "row") {
      style.sheet!.insertRule(":host { width: 2px; cursor: ew-resize; }");
    } else if (this.direction === "column") {
      style.sheet!.insertRule(":host { height: 2px; cursor: ns-resize; }");
    }

    this.addEventListener("mousedown", this._handleResizeStart);
  }

  private _handleResizeStart = (e: MouseEvent) => {
    if (!this.parentElement) return;
    if (!this.direction) return;

    document.body.style.userSelect = "none";
    document.body.style.cursor = this.direction === "column" ? "ns-resize" : "ew-resize";

    let totalFlex = 0;
    let totalSize = 0;

    this._siblingFrames = Array.from(this.parentElement.children).filter(isFrame);
    this._initialPosition = this.direction === "column" ? e.clientY : e.clientX;
    this._initialSiblingFlex = new Map();

    for (const frame of this._siblingFrames) {
      const flex = parseStyle(frame, "flex", 1);
      totalFlex += flex;

      const box = frame.getBoundingClientRect();
      totalSize += this.direction === "column" ? box.height : box.width;

      this._initialSiblingFlex.set(frame, flex);
    }

    this._flexPerPixel = totalFlex / totalSize;

    window.addEventListener("mousemove", this._handleResize);
    window.addEventListener("mouseup", this._handleResizeStop);
  };

  private _handleResize = (e: MouseEvent) => {
    if (this._initialPosition === undefined) return;
    if (this._initialSiblingFlex === undefined) return;
    if (this._flexPerPixel === undefined) return;

    const currentPosition = this.direction === "column" ? e.clientY : e.clientX;
    const delta = currentPosition - this._initialPosition;
    const deltaFlex = Math.abs(delta * this._flexPerPixel);

    const growing = delta > 0 ? getFrameBefore(this) : getFrameAfter(this);
    let shrinking = delta > 0 ? getFrameAfter(this) : getFrameBefore(this);

    if (!growing || !shrinking) return;

    let flexBalance = deltaFlex;

    while (shrinking && flexBalance > 0) {
      const minSize =
        this.direction === "column"
          ? parseStyle(shrinking, "minHeight")
          : parseStyle(shrinking, "minWidth");

      const minFlex = minSize * this._flexPerPixel;
      const currentFlex = this._initialSiblingFlex.get(shrinking)!;
      const frameDeltaFlex = Math.min(currentFlex - minFlex, flexBalance);

      const shrinkingFlex = currentFlex - frameDeltaFlex;
      shrinking.style.flexGrow = String(shrinkingFlex);

      shrinking = delta > 0 ? getFrameAfter(shrinking) : getFrameBefore(shrinking);
      flexBalance -= frameDeltaFlex;
    }

    const currentFlex = this._initialSiblingFlex.get(growing)!;
    const growingFlex = currentFlex + deltaFlex - flexBalance;
    growing.style.flexGrow = String(growingFlex);
  };

  private _handleResizeStop = () => {
    document.body.style.removeProperty("user-select");
    document.body.style.removeProperty("cursor");

    this._siblingFrames = undefined;
    this._initialPosition = undefined;
    this._initialSiblingFlex = undefined;
    this._flexPerPixel = undefined;

    window.removeEventListener("mousemove", this._handleResize);
    window.removeEventListener("mouseup", this._handleResizeStop);
  };
}

function isFrame(element: Element): element is HTMLElement {
  return (
    !!element.previousElementSibling?.matches("w-splitter") ||
    !!element.nextElementSibling?.matches("w-splitter")
  );
}

function getFrameBefore(element: Element) {
  let current: Element | null = element;
  while ((current = current.previousElementSibling)) {
    if (isFrame(current)) return current;
  }
}
function getFrameAfter(element: Element) {
  let current: Element | null = element;
  while ((current = current.nextElementSibling)) {
    if (isFrame(current)) return current;
  }
}

function parseStyle(element: HTMLElement, property: keyof CSSStyleDeclaration, defaultValue = 0) {
  const value = getComputedStyle(element)[property as any];
  if (!value) return defaultValue;
  return parseFloat(value) || defaultValue;
}

customElements.define("w-splitter", Splitter);

declare global {
  interface HTMLElementTagNameMap {
    "w-splitter": Splitter;
  }
}
