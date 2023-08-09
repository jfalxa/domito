export class Pane extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const slot = document.createElement("slot");
    this.shadowRoot!.append(slot);

    const style = document.createElement("style");
    this.shadowRoot!.append(style);
    style.sheet!.insertRule(":host { display: flex; flex: 1 1 0; align-self: stretch; min-width: 0; min-height: 0; box-sizing: border-box; overflow: auto; }"); // prettier-ignore
    style.sheet!.insertRule(":host([row]) { flex-direction: row; }");
    style.sheet!.insertRule(":host([column]) { flex-direction: column; }");
  }
}

customElements.define("w-pane", Pane);

declare global {
  interface HTMLElementTagNameMap {
    "w-pane": Pane;
  }
}
