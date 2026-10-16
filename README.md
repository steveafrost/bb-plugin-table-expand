# Table Expand

bb plugin: click a markdown table in the timeline (or its hover expand button)
to open it full width in a modal. Esc, the close button, or the backdrop closes it.
Clicks on links/code buttons and text selections inside the table are ignored.

Pairs with the Codex theme rule that keeps tables inside the message column.
Content script keyed on bb's markdown table DOM; may need updating after bb releases.

    bb plugin install path:$PWD
    bb plugin dev     # rebuild + reload on save

## Install from GitHub

    bb plugin install git:https://github.com/steveafrost/bb-plugin-table-expand.git@master

Optional companion CSS (theme or `customCss`) keeps tables inside the message column:

```css
[data-markdown-preview] div.my-2.flex.justify-center:has(> div.overflow-x-auto > table) {
  width: 100% !important;
  margin-inline: 0 !important;
  justify-content: flex-start;
}
```
