<p align="center">
  <a href="https://shichangqi.github.io/scq-vue/">
    <img src="https://shichangqi.github.io/scq-vue/logo.svg" width="96" height="96" alt="SCQ VUE Logo" />
  </a>
</p>

# scq-vue

A Vue 3 component library for desktop and mobile.

[Documentation and examples](https://shichangqi.github.io/scq-vue/)

## Playground documentation

Run `pnpm dev:play` to browse the component documentation locally. Each component
page keeps all examples together, followed by its API reference (props, events,
slots and methods). Standalone pages pass their base API tables through the
`api` slot of [ComponentDocView](./playground/src/views/ComponentDocView.vue), so
they appear after the advanced examples and before the additional API tables.

Example previews use six rotating pastel gradients, with colors and the shared
background defined in [playground.css](./playground/src/playground.css).
The `--demo-preview-*` tokens apply only to the outer preview background.
Content sections retain their theme surfaces, and component backgrounds and
standalone examples remain independent of the preview palette.
