<template>
  <svg
    class="scq-luxury-lightning brand-mark"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <!-- 高端物理柔和悬浮景深投影 -->
      <filter id="monogramShadow" x="-25%" y="-20%" width="150%" height="150%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#020817" flood-opacity="0.36" />
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0284c7" flood-opacity="0.22" />
      </filter>

      <!-- 倒角流光高能发光滤镜 -->
      <filter id="monogramRidgeGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- 左翼面：极速冰川青白金 -> 纯正电光钴蓝 -> 深邃流体蓝 -->
      <linearGradient id="facetLightGrad" x1="40" y1="14" x2="65" y2="106" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#E0F7FF" />
        <stop offset="22%" stop-color="#38BDF8" />
        <stop offset="55%" stop-color="#0284C7" />
        <stop offset="85%" stop-color="#1D4ED8" />
        <stop offset="100%" stop-color="#0B132B" />
      </linearGradient>

      <!-- 右翼面：奢华深海靛蓝 -> 极夜黑曜石（塑造极致沉稳的 3D 厚度与机械雕塑感） -->
      <linearGradient id="facetDarkGrad" x1="78" y1="20" x2="48" y2="106" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.9" />
        <stop offset="25%" stop-color="#1D4ED8" />
        <stop offset="60%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>

      <!-- 脊线倒角晶莹高光线（1px 激光雕刻倒角水银光） -->
      <linearGradient id="ridgeSheenGrad" x1="66" y1="14" x2="48" y2="106" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
        <stop offset="25%" stop-color="#E0F2FE" stop-opacity="0.95" />
        <stop offset="52%" stop-color="#38BDF8" stop-opacity="0.5" />
        <stop offset="85%" stop-color="#FFFFFF" stop-opacity="0.85" />
        <stop offset="100%" stop-color="#BAE6FD" stop-opacity="0.1" />
      </linearGradient>

      <!-- 周期性奢华流光掠影渐变 -->
      <linearGradient id="glintBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38BDF8" stop-opacity="0" />
        <stop offset="50%" stop-color="#FFFFFF" stop-opacity="1" />
        <stop offset="100%" stop-color="#00F5FF" stop-opacity="0" />
      </linearGradient>

      <!-- 底层克制极光辐射弱辉光 -->
      <radialGradient id="monogramAmbientAura" cx="50%" cy="54%" r="48%">
        <stop offset="0%" stop-color="#0284C7" stop-opacity="0.18" />
        <stop offset="55%" stop-color="#1E40AF" stop-opacity="0.06" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 底层克制极光环境辉光 -->
    <circle class="monogram-ambient" cx="60" cy="58" r="46" fill="url(#monogramAmbientAura)" />

    <!-- 闪电雕塑立体总成 -->
    <g class="monogram-sculpture" filter="url(#monogramShadow)">
      <!-- 图层 1：右侧背光暗面（深邃曜石与靛蓝，构筑强烈的 3D 棱镜厚度） -->
      <path
        class="monogram-facet-dark"
        d="M 66 14
           C 68 14, 73 24, 75 36
           C 77 46, 73 54, 62 55
           L 79 55
           C 83 55, 84 59, 80 64
           L 50 105
           C 48 107, 46 106, 47 103
           L 58 65
           L 46 65
           C 54 52, 62 30, 66 14 Z"
        fill="url(#facetDarkGrad)"
      />

      <!-- 右暗面微倒角细边（精细冷钢质感） -->
      <path
        d="M 66 14 C 73 24, 75 38, 74 54 L 79 55 C 83 55, 84 59, 80 64 L 48 105"
        stroke="#7DD3FC"
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.45"
      />

      <!-- 图层 2：左侧主受光流体面（白金与电光青蓝，饱满流体弧度） -->
      <path
        class="monogram-facet-light"
        d="M 66 14
           C 60 14, 48 30, 42 45
           C 38 53, 41 62, 49 62
           L 62 62
           L 47 104
           C 45 108, 49 108, 52 104
           L 60 76
           L 66 54
           L 56 54
           C 51 54, 48 50, 50 46
           L 61 24
           C 64 17, 65 14, 66 14 Z"
        fill="url(#facetLightGrad)"
      />

      <!-- 图层 3：中脊棱线高光带（贯穿整枚闪电的核心流体脊梁，晶莹水银光泽） -->
      <path
        class="monogram-ridge-line"
        d="M 66 14
           C 62 22, 52 38, 46 48
           C 43 54, 46 58, 52 58
           L 64 58
           L 48 104"
        stroke="url(#ridgeSheenGrad)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.95"
      />

      <!-- 极细纯白微倒角刀锋光（0.8px 激光切割精工倒角线） -->
      <path
        d="M 66 15 L 46 50 L 59 50 L 49 96"
        stroke="#FFFFFF"
        stroke-width="1.1"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.9"
      />

      <!-- 图层 4：动态奢华流光掠影波（周期性扫掠光波，如流体金属折光） -->
      <path
        class="monogram-glint-sweep"
        d="M 66 14
           L 44 52
           L 64 52
           L 48 104"
        stroke="url(#glintBeamGrad)"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        pathLength="100"
        filter="url(#monogramRidgeGlow)"
      />
    </g>

    <!-- 顶针极细冷光聚焦点 -->
    <circle cx="66" cy="14" r="1.4" fill="#FFFFFF" opacity="0.95" />
  </svg>
</template>

<style scoped>
.scq-luxury-lightning {
  display: inline-block;
  vertical-align: middle;
  overflow: visible;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-luxury-lightning:hover {
  transform: scale(1.1) translateY(-1px);
}

/* 底层环境光优雅慢呼吸 */
.monogram-ambient {
  transform-origin: 60px 58px;
  animation: monogramAuraPulse 4.8s ease-in-out infinite;
}

/* 闪电整体微重力平滑悬浮（优雅平稳，不晃眼） */
.monogram-sculpture {
  transform-origin: 60px 58px;
  animation: monogramLevitate 3.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

/* 表面中脊高光随水流张力微妙浮动 */
.monogram-ridge-line {
  stroke-dasharray: 60 20;
  stroke-dashoffset: 0;
  animation: monogramRimShift 4s ease-in-out infinite alternate;
}

/* 核心奢华动效：流光掠影（周期性光耀扫掠，如顶级流体金属） */
.monogram-glint-sweep {
  stroke-dasharray: 24 76;
  stroke-dashoffset: 24;
  animation: monogramGlintFlow 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

/* 悬停时流光顺畅加速 */
.scq-luxury-lightning:hover .monogram-glint-sweep {
  animation-duration: 1.4s;
}

@keyframes monogramAuraPulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(0.97);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes monogramLevitate {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-2px);
  }
}

@keyframes monogramRimShift {
  0% {
    stroke-dashoffset: 8;
    opacity: 0.85;
  }
  50% {
    opacity: 1;
  }
  100% {
    stroke-dashoffset: -8;
    opacity: 0.9;
  }
}

@keyframes monogramGlintFlow {
  0% {
    stroke-dashoffset: 24;
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  65% {
    opacity: 1;
  }
  85% {
    stroke-dashoffset: -76;
    opacity: 0;
  }
  100% {
    stroke-dashoffset: -76;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scq-luxury-lightning:hover,
  .monogram-ambient,
  .monogram-sculpture,
  .monogram-ridge-line,
  .monogram-glint-sweep {
    animation: none;
    transform: none;
  }
}
</style>\n