# @klyro/widget

The Klyro widget allows you to easily embed an AI-powered chat interface into any website. It works as a simple script tag for static sites or as a React-compatible module for modern applications.

## Installation

```bash
npm install @klyro/widget
```

---

## Obtaining Your Widget Key

To use the widget, follow these steps in your Klyro dashboard:

1.  **Add Knowledge**:
    - Log in to your dashboard at [https://klyro-pro.vercel.app/](https://klyro-pro.vercel.app/).
    - Navigate to the **Knowledge Base** tab.
    - Upload documents (PDFs, TXT) or add text. This is the data your AI will use to answer visitor questions.
2.  **Define AI Persona**:
    - Go to the **AI Persona** tab.
    - Customize your bot's identity, communication style (e.g., professional, casual), and specific traits. This defines _how_ your bot speaks.
3.  **Customize UI & Retrieve Key**:
    - Navigate to the **Integrations** tab.
    - Click the **Settings icon** (⚙️) on your widget card to customize the **Primary Color**, **Greeting Message**, **Theme**, and **Position**.
    - Once saved, your unique **Widget Key** will be visible in the "Installation Code" section of this tab.

---

## Usage

### 1. React / Next.js (Recommended)

For modern frameworks, use the programmatic `initKlyro` function.

```tsx
"use client";
import { useEffect } from "react";
import { initKlyro } from "@klyro/widget";

export default function ChatWidget() {
  useEffect(() => {
    initKlyro({
      key: "YOUR_WIDGET_KEY",
    });
  }, []);

  return null;
}
```

### 2. Static HTML (Script Tag)

Add the following script tag to your HTML `<head>` or before the closing `</body>` tag.

```html
<script
  src="https://unpkg.com/@klyro/widget/dist/widget.js"
  data-widget-key="YOUR_WIDGET_KEY"
  async
></script>
```

---

## Configuration Options

When using `initKlyro(options)`, you can pass the following properties:

| Property    | Type                  | Description                                                                                                                                 | Required |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `key`       | `string`              | Your unique Klyro widget key.                                                                                                               | Yes      |
| `apiBase`   | `string`              | Origin the widget calls for config and chat. Defaults to `https://klyro-pro.vercel.app`. Set this when self-hosting or pointing at a local dev server. | No       |
| `inline`    | `boolean`             | Render the chat panel in the page instead of as a floating launcher button. Defaults to `false`.                                            | No       |
| `container` | `string \| Element`   | Where to mount when `inline` is `true`: a CSS selector or an element. Ignored unless `inline` is set.                                        | No       |

`initKlyro` also accepts a bare string as shorthand for `{ key }`:

```js
initKlyro("YOUR_WIDGET_KEY");
```

### Inline mode

```html
<div id="chat" style="height: 600px"></div>
<script src="https://unpkg.com/@klyro/widget/dist/widget.js"></script>
<script>
  initKlyro({
    key: "YOUR_WIDGET_KEY",
    inline: true,
    container: document.getElementById("chat"),
  });
</script>
```

### Sending a message programmatically

```js
klyroSendMessage("What have you been working on?");
```

Both `initKlyro` and `klyroSendMessage` are available as named exports from the
package and as globals on `window` when loaded from a script tag.

---

## Streaming

From `3.0.0` the widget streams answers token by token over Server-Sent Events,
rendering text as the model produces it instead of waiting for the full
response. Citations arrive after the answer and render as a collapsed
**Sources (n)** row beneath each reply.

This requires a Klyro backend that supports streaming. Against an older
deployment the widget detects that the response is not `text/event-stream` and
falls back to the previous buffered JSON request automatically, so it stays
compatible either way.

---

## Troubleshooting & Common Issues

### 1. "Cannot find module '@klyro/widget'"

If you're using TypeScript and see this error after installing:

- Ensure you are on version `1.1.1` or higher (which includes types).
- Restart your TypeScript server (VS Code: `Cmd+Shift+P` -> `TypeScript: Restart TS Server`).

### 2. "document is not defined" (SSR Error)

The widget interacts with the DOM and cannot run on the server.

- **Next.js:** Ensure the component calling `initKlyro` is marked with `"use client";` and the call is inside a `useEffect` hook.
- **Other Frameworks:** Ensure initialization only happens after the window/document is available.

### 3. CORS Policy Blocked

If the widget fails to fetch its configuration:

- Ensure your backend allows requests from the domain where the widget is hosted.

### 4. Widget Not Appearing

- Verify your `data-widget-key` is correct.
- Check the browser console for any "404 Not Found" errors related to the widget configuration fetch.
- Ensure the allowed routes in your Klyro dashboard match the current URL.

---

## License

MIT © [Klyro](https://klyro-pro.vercel.app/)
