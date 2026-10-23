# D365 Web Resource Cookbook

Recipes for HTML web resources on Dynamics 365 / Dataverse model-driven forms. It starts with two patterns and five working examples:

- **The handshake** — how one form OnLoad script hands `formContext` to any number of HTML web resources, with a fallback.
- **JSON storage** — how to keep a table with any number of rows in a single Multiple lines of text column.

The examples were originally built for a budget submission form, which is why they cover risks, demographics, principles, revenue and savings. Each one saves through the normal form save; none of them call the Web API.

| Component | File | Saves to |
| --- | --- | --- |
| Risks/Opportunities | `risksopportunities.html` | 14 Multiple lines of text columns (`new_risk_…`, `new_opp_…`) |
| Demographics | `demographics.html` | `new_demographics` (JSON) |
| LTFP Principles | `ltfpprinciples.html` | `new_ltfpprinciples` (JSON) |
| Financial Impacts (revenue) | `financialimpacts.html` | `new_financialimpacts` (JSON) + `new_totalbudgetimprovement` (Currency) |
| Savings Measures | `savingsmeasures.html` | `new_savingsmeasures` (JSON) |
| Form OnLoad | `form_onload.js` | — |

The `new_` prefix is a placeholder. Replace it with your own publisher prefix, and change the column names in each file's config block to match your columns. In `ltfpprinciples.html`, replace the placeholder `PRINCIPLES` wording with your organisation's.

## Setup

1. Create the columns listed above on your table (Multiple lines of text, max length 100,000 for the JSON ones).
2. Add those columns to the form in a hidden section. The components can only read and write columns that are on the form.
3. Upload each HTML file as a Webpage (HTML) web resource and place it on the form. Control names must match `WEB_RESOURCE_CONTROLS` in `form_onload.js` (e.g. `WebResource_demographics`).
4. Upload `form_onload.js` as a Script (JScript) web resource, add it under **Form libraries**, and register `WebResourceHandshake.onLoad` on **On Load** with **Pass execution context as first parameter** ticked.
5. Save, publish, and hard-refresh the form (Ctrl+F5).

## How it works

### Part 1: The handshake

An HTML web resource runs in its own iframe, so it can't see the form until something hands it `formContext`. The OnLoad script does that.

In each HTML file, the page offers a public function:

```javascript
window.setClientApiContext = function (xrm, fc) { bind(fc, "OnLoad JS"); };
```

In `form_onload.js`, the form checks for that function and calls it:

```javascript
wrControl.getContentWindow().then(function (contentWindow) {
  if (contentWindow && typeof contentWindow.setClientApiContext === "function") {
    contentWindow.setClientApiContext(Xrm, formContext);
  }
});
```

| Code | Meaning |
| --- | --- |
| `window.setClientApiContext = …` | Put the function on the page's `window` so code outside the page can call it. |
| `function (xrm, fc)` | Two inputs: the `Xrm` object (unused) and `fc`, the form context. |
| `bind(fc, "OnLoad JS")` | Read the columns, fill the cells, listen for typing. The label only feeds the console message. |
| `getContentWindow()` | Wait for the web resource page to load, then return its window. |
| `contentWindow && …` | Stop if the page doesn't exist, instead of crashing. |
| `typeof … === "function"` | Only call it if the page really offers that function. |

`setClientApiContext` is not a Dynamics keyword; both sides just have to use the same name.

**Fallback:** if the handshake hasn't arrived, each component checks every 100 ms for `parent.Xrm.Page` and binds through that, giving up after about 5 seconds. `Xrm.Page` is deprecated and fails when cross-frame scripting is restricted, so keep the OnLoad script registered.

**Adding a component:** add its control name to `WEB_RESOURCE_CONTROLS` in `form_onload.js`. One OnLoad handler serves every component.

### Part 2: Many rows in one column (JSON)

A Multiple lines of text column can hold any text, so the table-style components write the whole table as one JSON value. Dataverse sees one value; the HTML reads it back into rows.

Example of what Savings Measures stores:

```json
[
  {
    "measure": "Reduce printing costs",
    "budget": "50K",
    "expected": "30K",
    "description": "Move to digital forms\nOne-off setup cost in year 1"
  }
]
```

| Symbol | Meaning | In the table |
| --- | --- | --- |
| `[ … ]` | a list (array) | the table |
| `{ … }` | one object | one row |
| `"measure": "…"` | key: value | one cell |
| `\n` | line break | Enter pressed in a cell |

**Saving:** `collect()` builds the list from the rows, `JSON.stringify()` turns it into text, and `attr.setValue()` puts it in the column. The form save stores it.

**Loading:** `attr.getValue()` returns the text, `JSON.parse()` turns it back into a list, and `render()` / `addRow()` draw the rows.

**Adding a cell:** add one entry to `FIELDS`, plus one `<th>` and one `<col>`. Older records without that key show the cell empty.

| One JSON column | Separate columns or a child table |
| --- | --- |
| Any number of rows in one column | Each value can be filtered, sorted and summed |
| No extra tables or relationships | Works in views and Advanced Find |
| Views can't see inside it | More setup |

Use JSON for content people read. Use real columns for values you need to filter or total.

## Troubleshooting

Open F12 → Console and filter by the component name, e.g. `[Demographics]`.

| Message | Meaning |
| --- | --- |
| `connected via OnLoad JS after …ms` | Handshake worked. |
| `connected via parent.Xrm.Page fallback` | OnLoad script didn't connect: check its registration and the control name. |
| `Add new_… to the form` | The column is missing from the form, or its name differs. |
| No message | An old cached version is running: publish, then Ctrl+F5. |

Components lock when the form is Read Only (form type 3), the record is inactive (form type 4), or the backing column's control is disabled.
