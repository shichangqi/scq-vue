<template>
  <div class="docs-layout">
    <aside class="docs-sidebar">
      <div class="brand">SCQ VUE</div>
      <div class="menu-group">开发指南</div>
      <RouterLink class="menu-item" to="/guide">快速开始</RouterLink>
      <div class="menu-group">组件</div>
      <RouterLink class="menu-item" to="/components/button">Button 按钮</RouterLink>
      <RouterLink class="menu-item" to="/components/input">Input 输入框</RouterLink>
      <RouterLink class="menu-item" to="/components/chat-message">ChatMessage 聊天气泡</RouterLink>
    </aside>
    <main class="docs-main">
      <RouterView />
    </main>
  </div>
</template>
