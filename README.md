# scq-vue

A Vue 3 component library made by Chauncy.

## Online Demo

After GitHub Pages deployment is enabled, the playground will be available at:

```text
https://<your-github-username>.github.io/scq-vue/
```

You can replace the placeholder with your actual GitHub username after the first successful deployment.

## Install

```bash
npm install scq-vue
yarn add scq-vue
pnpm add scq-vue
```

## Usage

### Global install

```ts
import { createApp } from 'vue'
import App from './App.vue'
import ScqVue from 'scq-vue'
import 'scq-vue/style.css'

createApp(App).use(ScqVue).mount('#app')
```

After global install, you can use component tags directly in templates:

```vue
<template>
	<scq-button type="primary">Primary</scq-button>
	<scq-input v-model="value" placeholder="Please input" />
	<scq-chat-message :message="message" role="ai" :timestamp="Date.now()" />
</template>
```

Notes:
- Use prefixed tag names only: `scq-button`, `scq-input`, `scq-chat-message`

### On-demand import

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { ScqButton, ScqInput, ScqChatMessage } from 'scq-vue'
import 'scq-vue/style.css'

const app = createApp(App)
app.use(ScqButton)
app.use(ScqInput)
app.use(ScqChatMessage)
app.mount('#app')
```

Then use in templates:

```vue
<template>
	<scq-button>Default</scq-button>
	<scq-input v-model="value" />
	<scq-chat-message :message="message" role="user" :show-time="false" />
</template>
```

### On-demand style import

```ts
import { ScqButton, ScqInput, ScqChatMessage } from 'scq-vue'
import 'scq-vue/styles/button.css'
import 'scq-vue/styles/input.css'
import 'scq-vue/styles/chat-message.css'
```

## Components

- Button
- Input
- ChatMessage

## ChatMessage

ChatMessage is designed for chat scenarios and supports API response data rendering directly.

### Features

- Supports plain text, JSON and Markdown content
- Supports code highlighting (Markdown code blocks and JSON view)
- Supports two message roles: AI and user
- Supports configurable time display

### Basic example

```vue
<template>
	<scq-chat-message
		:message="apiData"
		role="ai"
		content-type="auto"
		:show-time="true"
		:timestamp="Date.now()"
	/>
</template>

<script setup lang="ts">
const apiData = {
	id: 'msg_001',
	text: 'This is response data from API',
	code: 'const x = 1',
}
</script>
```

### Props

| Prop | Description | Type | Default |
| --- | --- | --- | --- |
| message | Message data from API | unknown | - |
| role | Message role | `ai` \| `user` | `ai` |
| contentType | Content type | `auto` \| `text` \| `markdown` \| `json` | `auto` |
| showTime | Whether to display timestamp | boolean | true |
| timestamp | Message time value | string \| number \| Date \| null | null |
| timeFormatter | Custom time formatter | `(value) => string` | - |

### Content type behavior

- `auto`: detect JSON string / Markdown / plain text automatically
- `text`: force plain text rendering
- `markdown`: force Markdown rendering
- `json`: force JSON pretty rendering

## Playground

Run the local docs playground:

```bash
pnpm install
pnpm dev:play
```

Build the playground for static hosting:

```bash
pnpm build:play
```

The playground uses hash history, so it is suitable for static hosting platforms such as GitHub Pages.

## Deploy Playground To GitHub Pages

This repository already includes a GitHub Actions workflow for deploying the playground to GitHub Pages.

### Steps

1. Push the repository to GitHub.
2. Make sure the default branch is `main`.
3. Open repository `Settings -> Pages`.
4. Set `Source` to `GitHub Actions`.
5. Push a commit to `main`, or manually trigger the workflow from the `Actions` tab.

### Deployment URL

For this repository name `scq-vue`, the GitHub Pages URL will be:

```text
https://<your-github-username>.github.io/scq-vue/
```

### Notes

- The playground Vite config uses `/scq-vue/` as the production base path during GitHub Actions builds.
- The workflow file is located at `.github/workflows/deploy-playground.yml`.
- The playground output directory is `playground/dist`.

<!-- ## Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm dev:play
```

## Publish

1. Update version in package.json
2. Build package

```bash
pnpm build
```

3. Login and publish

```bash
npm login
npm publish
```

## Build output

- dist/scq-vue.es.js
- dist/scq-vue.umd.js
- dist/style.css
- dist/types -->
