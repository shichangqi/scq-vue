<template>
  <div class="phone-preview">
    <!-- 实体按键拟真细节 -->
    <div class="phone-preview__chassis">
      <div class="phone-preview__btn phone-preview__btn--silent" aria-hidden="true"></div>
      <div class="phone-preview__btn phone-preview__btn--vol-up" aria-hidden="true"></div>
      <div class="phone-preview__btn phone-preview__btn--vol-down" aria-hidden="true"></div>
      <div class="phone-preview__btn phone-preview__btn--power" aria-hidden="true"></div>

      <!-- 手机主体中框与屏幕 -->
      <div class="phone-preview__device">
        <div :id="screenId" class="phone-preview__screen">
          <!-- 灵动岛 / 顶部相机开孔 -->
          <div class="phone-preview__island" aria-hidden="true">
            <span class="phone-preview__camera"></span>
            <span class="phone-preview__sensor"></span>
          </div>

          <!-- 系统状态栏 -->
          <div class="phone-preview__status-bar" aria-hidden="true">
            <span class="phone-preview__time">9:41</span>
            <div class="phone-preview__status-icons">
              <!-- 信号格 -->
              <svg class="phone-preview__signal" viewBox="0 0 18 12" fill="currentColor">
                <rect x="1" y="9" width="2.5" height="3" rx="0.6" />
                <rect x="5" y="6.5" width="2.5" height="5.5" rx="0.6" />
                <rect x="9" y="4" width="2.5" height="8" rx="0.6" />
                <rect x="13" y="1" width="2.5" height="11" rx="0.6" />
              </svg>
              <!-- 5G 标识 -->
              <span class="phone-preview__network">5G</span>
              <!-- 电池图标 -->
              <span class="phone-preview__battery">
                <span class="phone-preview__battery-level"></span>
              </span>
            </div>
          </div>

          <!-- 手机内容展示区 -->
          <div class="phone-preview__content">
            <slot />
          </div>

          <!-- 底部 Home Indicator 手势横条 -->
          <div class="phone-preview__home-bar" aria-hidden="true">
            <span class="phone-preview__home-indicator"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ screenId: string }>()
</script>

<style scoped>
.phone-preview {
  display: flex;
  justify-content: center;
  max-width: 100%;
  padding: 16px 0 24px;
  user-select: none;
}

.phone-preview__chassis {
  position: relative;
  display: inline-flex;
  min-width: 0;
  max-width: calc(100% - 8px);
}

/* 侧边物理按键 */
.phone-preview__btn {
  position: absolute;
  background: #cbd5e1;
  border-radius: 3px;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.15);
}

.phone-preview__btn--silent {
  left: -3px;
  top: 72px;
  width: 3px;
  height: 24px;
}

.phone-preview__btn--vol-up {
  left: -3px;
  top: 110px;
  width: 3px;
  height: 38px;
}

.phone-preview__btn--vol-down {
  left: -3px;
  top: 158px;
  width: 3px;
  height: 38px;
}

.phone-preview__btn--power {
  right: -3px;
  top: 120px;
  width: 3px;
  height: 48px;
}

/* 机身中框与高光边角 */
.phone-preview__device {
  position: relative;
  width: 332px;
  min-width: 0;
  max-width: 100%;
  padding: 9px;
  border-radius: 44px;
  background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.9) inset,
    0 1px 2px rgba(255, 255, 255, 0.8) inset,
    0 22px 48px -10px rgba(15, 23, 42, 0.22),
    0 10px 24px -6px rgba(64, 158, 255, 0.18);
  box-sizing: border-box;
}

/* 屏幕显示区域 */
.phone-preview__screen {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 600px;
  overflow: hidden;
  border-radius: 35px;
  background: #f8fafc;
  transform: translateZ(0);
  isolation: isolate;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

/* 灵动岛 */
.phone-preview__island {
  position: absolute;
  top: 9px;
  left: 50%;
  transform: translateX(-50%);
  width: 82px;
  height: 22px;
  border-radius: 999px;
  background: #0f172a;
  z-index: 105;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  gap: 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.24);
  pointer-events: none;
}

.phone-preview__camera {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1e293b;
  border: 1px solid #334155;
  box-shadow: inset 0 0 2px rgba(56, 189, 248, 0.4);
}

.phone-preview__sensor {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #090d16;
}

/* 系统状态栏 */
.phone-preview__status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 0 0 38px;
  padding: 0 22px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #1e293b;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.02em;
  z-index: 10;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.phone-preview__time {
  font-size: 13px;
  font-weight: 700;
}

.phone-preview__status-icons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-preview__signal {
  width: 15px;
  height: 10px;
}

.phone-preview__network {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.phone-preview__battery {
  position: relative;
  width: 20px;
  height: 10px;
  border: 1px solid currentColor;
  border-radius: 3px;
  padding: 1px;
  box-sizing: border-box;
}

.phone-preview__battery::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 2px;
  width: 1.5px;
  height: 4px;
  background: currentColor;
  border-radius: 0 1px 1px 0;
}

.phone-preview__battery-level {
  display: block;
  width: 78%;
  height: 100%;
  background: currentColor;
  border-radius: 1px;
}

/* 内容承载区 */
.phone-preview__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.phone-preview__content::-webkit-scrollbar {
  display: none;
}

/* 底部 Home Indicator 手势条 */
.phone-preview__home-bar {
  flex: 0 0 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-top: 1px solid rgba(0, 0, 0, 0.03);
}

.phone-preview__home-indicator {
  display: block;
  width: 110px;
  height: 4px;
  border-radius: 999px;
  background: #0f172a;
  opacity: 0.8;
}

@media (max-width: 480px) {
  .phone-preview__device {
    width: 310px;
  }
  .phone-preview__screen {
    height: 540px;
  }
}
</style>