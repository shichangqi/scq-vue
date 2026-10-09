<template>
  <PhonePreview :screen-id="previewId">
    <div class="mobile-example">
      <!-- 顶部临时通知微提示 -->
      <transition name="scq-toast">
        <div v-if="notice" class="mobile-toast" role="status">
          <scq-icon name="check" :size="15" />
          <span>{{ notice }}</span>
        </div>
      </transition>

      <!-- 1. Cell 演示：全功能个人中心与偏好设置页面 -->
      <template v-if="kind === 'cell'">
        <div class="demo-screen">
          <scq-nav-bar :title="label('个人中心', 'User Center')" />
          <div class="demo-screen__scroll">
            <!-- 个人名片横幅 -->
            <div class="user-card">
              <div class="user-card__avatar">
                <scq-icon name="user" :size="28" />
              </div>
              <div class="user-card__info">
                <div class="user-card__name-row">
                  <span class="user-card__name">Ada Lovelace</span>
                  <scq-tag type="primary" effect="dark" size="small">PRO</scq-tag>
                </div>
                <span class="user-card__meta">ID: 809247 · ada@example.com</span>
              </div>
            </div>

            <!-- 第一组：账号与偏好 -->
            <scq-cell-group :title="label('通用设置', 'Preferences')" :inset="true">
              <scq-cell
                :title="label('个人资料', 'Profile')"
                :value="label('已完善', 'Complete')"
                icon="user"
                is-link
                @click="showNotice(label('已点击个人资料', 'Profile clicked'))"
              />
              <scq-cell
                :title="label('消息提醒', 'Push Notifications')"
                :label="label('接收系统关键更新与动态', 'Receive critical updates')"
                icon="info"
              >
                <scq-switch v-model="enabled" :aria-label="label('消息通知', 'Notifications')" />
              </scq-cell>
              <scq-cell
                :title="label('界面语言', 'Language')"
                :value="locale === 'zh-CN' ? '简体中文' : 'English'"
                icon="search"
                is-link
                @click="showNotice(label('已选择语言设置', 'Language settings selected'))"
              />
            </scq-cell-group>

            <!-- 第二组：系统与安全 -->
            <scq-cell-group :title="label('安全与服务', 'Security & Service')" :inset="true" style="margin-top: 14px;">
              <scq-cell
                :title="label('云端存储', 'Cloud Storage')"
                value="12.8 GB / 50 GB"
                icon="inbox"
                is-link
                @click="showNotice(label('已查看存储空间', 'Storage details viewed'))"
              />
              <scq-cell
                v-if="secondary"
                :title="label('实验性功能', 'Experimental Features')"
                is-link
                disabled
              />
              <scq-cell
                v-else
                :title="label('应用版本', 'App Version')"
                value="v1.1.13 (Build 2026)"
                icon="settings"
                is-link
                @click="showNotice(label('已是最新版本', 'Already the latest version'))"
              />
            </scq-cell-group>
          </div>
        </div>
      </template>

      <!-- 2. NavBar 演示：拟真订单/配置确认界面 -->
      <template v-else-if="kind === 'nav-bar'">
        <div class="demo-screen">
          <scq-nav-bar
            :title="label('配置结算', 'Checkout')"
            left-arrow
            :right-text="secondary ? '' : label('保存', 'Save')"
            :right-icon="secondary ? 'settings' : undefined"
            :right-label="label('设置', 'Settings')"
            @click-left="showNotice(label('返回上一级', 'Back action'))"
            @click-right="showNotice(label('设置已保存', 'Settings saved'))"
          />
          <div class="demo-screen__scroll">
            <div class="status-banner">
              <div class="status-banner__icon">
                <scq-icon name="check" :size="24" />
              </div>
              <div class="status-banner__text">
                <span class="status-banner__title">{{ label('待确认配置', 'Pending Confirmation') }}</span>
                <span class="status-banner__desc">{{ label('请核对服务清单与扣费明细', 'Review items and charges') }}</span>
              </div>
            </div>

            <scq-cell-group :inset="true">
              <scq-cell :title="label('服务方案', 'Plan')" value="SCQ VUE Cloud Pro" />
              <scq-cell :title="label('生效节点', 'Cluster')" value="ap-east-1" />
              <scq-cell :title="label('到期时间', 'Expires')" value="2027-10-09" />
              <scq-cell :title="label('自动续订', 'Auto Renewal')">
                <scq-switch v-model="enabled" :aria-label="label('自动续订', 'Auto renewal')" />
              </scq-cell>
            </scq-cell-group>

            <div class="mobile-example__body" style="padding: 20px 14px 10px;">
              <scq-button type="primary" round style="width: 100%; height: 44px;" @click="showNotice(label('已提交确认', 'Confirmed'))">
                {{ label('确认并生效', 'Confirm Plan') }}
              </scq-button>
            </div>
          </div>
        </div>
      </template>

      <!-- 3. Tabbar 演示：具备真实多页面切换的移动端主屏 -->
      <template v-else-if="kind === 'tabbar'">
        <div class="demo-screen">
          <scq-nav-bar :title="activeLabel" />

          <div class="demo-screen__scroll">
            <!-- 页面一：首页概览 -->
            <div v-if="active === 'home'" class="tab-page">
              <div class="stat-card">
                <div class="stat-card__head">
                  <span class="stat-card__label">{{ label('今日任务', 'Tasks Today') }}</span>
                  <scq-tag type="success" size="small">{{ label('进行中', 'Running') }}</scq-tag>
                </div>
                <div class="stat-card__num">12 / 16</div>
                <span class="stat-card__tip">{{ label('预计今日 18:00 前完成构建发布', 'Expected release at 18:00') }}</span>
              </div>

              <scq-cell-group :title="label('快捷工具', 'Quick Tools')" :inset="true" style="margin-top: 14px;">
                <scq-cell :title="label('发布部署流水线', 'CI/CD Pipelines')" value="8 Jobs" is-link @click="showNotice(label('打开流水线', 'Pipeline opened'))" />
                <scq-cell :title="label('设计资产库', 'Design Tokens')" value="240 Items" is-link @click="showNotice(label('打开资产库', 'Assets opened'))" />
              </scq-cell-group>
            </div>

            <!-- 页面二：消息中心 -->
            <div v-else-if="active === 'inbox'" class="tab-page">
              <scq-cell-group :inset="true">
                <scq-cell
                  :title="label('系统更新通知', 'System Release')"
                  :label="label('scq-vue v1.1.13 已发布', 'New version published')"
                  value="10:30"
                  icon="info"
                  is-link
                  @click="showNotice(label('阅读系统通知', 'Read system notice'))"
                />
                <scq-cell
                  :title="label('团队协作邀请', 'Workspace Invite')"
                  :label="label('Chauncy 邀请您加入协作', 'Invited you to project')"
                  value="09:15"
                  icon="user"
                  is-link
                  @click="showNotice(label('查看协作邀请', 'View invite'))"
                />
              </scq-cell-group>
            </div>

            <!-- 页面三：我的资料 -->
            <div v-else class="tab-page">
              <div class="user-card" style="margin-bottom: 14px;">
                <div class="user-card__avatar">
                  <scq-icon name="user" :size="28" />
                </div>
                <div class="user-card__info">
                  <span class="user-card__name">Chauncy</span>
                  <span class="user-card__meta">Core Maintainer</span>
                </div>
              </div>
              <scq-cell-group :inset="true">
                <scq-cell :title="label('偏好语言', 'Language')" :value="locale === 'zh-CN' ? '中文' : 'English'" is-link />
                <scq-cell :title="label('账号安全', 'Security')" value="98%" is-link />
              </scq-cell-group>
            </div>
          </div>

          <!-- 底部固定 Tabbar -->
          <scq-tabbar v-model="active" :items="tabItems" />
        </div>
      </template>

      <!-- 4. ActionSheet 演示：资产卡片与底部原生动作面板 -->
      <template v-else-if="kind === 'action-sheet'">
        <div class="demo-screen">
          <scq-nav-bar :title="label('文档详情', 'Document Details')" />
          <div class="demo-screen__scroll">
            <!-- 文件大卡片预览 -->
            <div class="file-card">
              <div class="file-card__badge">
                <scq-icon name="inbox" :size="36" />
              </div>
              <span class="file-card__title">SCQ-VUE-Design-Guide.pdf</span>
              <span class="file-card__size">18.4 MB · 2026-10-09 10:24</span>
              <scq-tag type="success" size="small" style="margin-top: 8px;">{{ label('已审核归档', 'Verified') }}</scq-tag>
            </div>

            <scq-cell-group :title="label('文件属性', 'Attributes')" :inset="true">
              <scq-cell :title="label('所有者', 'Owner')" value="Design System" />
              <scq-cell :title="label('权限', 'Access')" :value="label('公开只读', 'Public Read-only')" />
              <scq-cell :title="label('校验码', 'MD5')" value="9a7f...e4b1" />
            </scq-cell-group>

            <!-- 操作按钮触发器（保留 .mobile-example__body button 契约） -->
            <div class="mobile-example__body" style="padding: 16px 14px;">
              <scq-button type="primary" round style="width: 100%; height: 44px;" @click="visible = true">
                <scq-icon name="settings" :size="16" />
                <span>{{ label('文件操作', 'File Actions') }}</span>
              </scq-button>
            </div>
          </div>

          <!-- ActionSheet 动作面板挂载到当前手机屏幕内部 -->
          <scq-action-sheet
            v-if="previewReady"
            v-model="visible"
            :title="label('文件快捷操作', 'File Actions')"
            :actions="actions"
            :close-on-select="!secondary"
            :cancel-text="label('取消', 'Cancel')"
            :teleport="`#${previewId}`"
            @select="onSelect"
          />
        </div>
      </template>

      <!-- 5. Modal 移动端弹窗演示（多独立手机示例） -->
      <template v-else-if="kind === 'modal'">
        <div class="demo-screen">
          <scq-nav-bar :title="modalNavTitle" />
          <div class="demo-screen__scroll">
            <!-- 场景 A：基础信息提示 -->
            <template v-if="!variant">
              <div class="modal-feature-card">
                <div class="modal-feature-card__icon modal-feature-card__icon--blue">
                  <scq-icon name="info" :size="30" />
                </div>
                <span class="modal-feature-card__title">{{ label('系统版本检测', 'System Update') }}</span>
                <span class="modal-feature-card__desc">{{ label('发现新版本 v1.1.13，包含移动端设计重构', 'New version v1.1.13 is ready to explore') }}</span>
              </div>
              <scq-cell-group :inset="true">
                <scq-cell :title="label('更新渠道', 'Channel')" value="Stable" />
                <scq-cell :title="label('发布日期', 'Date')" value="2026-10-09" />
              </scq-cell-group>
              <div class="mobile-example__body" style="padding: 20px 14px 10px;">
                <scq-button type="primary" round style="width: 100%; height: 44px;" @click="modalVisible = true">
                  {{ label('查看升级说明', 'View Release Notes') }}
                </scq-button>
              </div>

              <scq-modal
                v-if="previewReady"
                v-model="modalVisible"
                :title="label('系统更新通知', 'Update Notice')"
                type="info"
                :confirm-button-text="label('我知道了', 'Got it')"
                :teleport="`#${previewId}`"
                @confirm="showNotice(label('已确认升级说明', 'Noted'))"
              >
                <p>{{ label('新版本已完成移动端组件设计升级，全面支持独立手机 UI 交互体验。', 'Mobile UI components have been refined with native phone preview experiences.') }}</p>
              </scq-modal>
            </template>

            <!-- 场景 B：双按钮操作确认与危险警告 -->
            <template v-else-if="variant === 'confirm'">
              <div class="modal-feature-card">
                <div class="modal-feature-card__icon modal-feature-card__icon--amber">
                  <scq-icon name="inbox" :size="30" />
                </div>
                <span class="modal-feature-card__title">{{ label('本地存储管理', 'Storage Management') }}</span>
                <span class="modal-feature-card__desc">{{ label('当前离线缓存已占用 2.4 GB 空间', 'Current cached data occupies 2.4 GB') }}</span>
              </div>
              <scq-cell-group :inset="true">
                <scq-cell :title="label('离线文件', 'Offline Files')" value="1.8 GB" />
                <scq-cell :title="label('临时草稿', 'Draft Cache')" value="614 MB" />
              </scq-cell-group>
              <div class="mobile-example__body" style="padding: 20px 14px 10px;">
                <scq-button type="danger" plain round style="width: 100%; height: 44px;" @click="modalVisible = true">
                  {{ label('清空本地缓存', 'Clear Cache') }}
                </scq-button>
              </div>

              <scq-modal
                v-if="previewReady"
                v-model="modalVisible"
                :title="label('确认清除缓存？', 'Clear Cache?')"
                type="confirm"
                :show-cancel-button="true"
                confirm-button-type="danger"
                :confirm-button-text="label('确认清除', 'Clear')"
                :cancel-button-text="label('取消', 'Cancel')"
                :teleport="`#${previewId}`"
                @confirm="showNotice(label('缓存已清理完成', 'Cache cleared'))"
                @cancel="showNotice(label('已取消操作', 'Cancelled'))"
              >
                <p>{{ label('清除后草稿与离线文件将被删除，需重新连接同步。', 'Local cached data will be permanently cleared from this device.') }}</p>
              </scq-modal>
            </template>

            <!-- 场景 C：自定义插槽内容与底部操作 -->
            <template v-else-if="variant === 'slot'">
              <div class="modal-feature-card">
                <div class="modal-feature-card__icon modal-feature-card__icon--purple">
                  <scq-icon name="settings" :size="30" />
                </div>
                <span class="modal-feature-card__title">SCQ Pro Developer</span>
                <span class="modal-feature-card__desc">{{ label('解锁专属私有化部署与高速云同步通道', 'Unlock unlimited private registry and priority support') }}</span>
              </div>
              <scq-cell-group :inset="true">
                <scq-cell :title="label('当前版本', 'Tier')" value="Community Free" />
                <scq-cell :title="label('特权状态', 'Status')" :value="label('未开通', 'Inactive')" />
              </scq-cell-group>
              <div class="mobile-example__body" style="padding: 20px 14px 10px;">
                <scq-button type="primary" round style="width: 100%; height: 44px;" @click="modalVisible = true">
                  {{ label('查看会员特权', 'View Pro Plan') }}
                </scq-button>
              </div>

              <scq-modal
                v-if="previewReady"
                v-model="modalVisible"
                :title="label('开通 Pro 特权计划', 'SCQ Pro Plan')"
                :show-close="true"
                :teleport="`#${previewId}`"
              >
                <div class="modal-benefit-box">
                  <p style="font-weight: 600; color: #0f172a; margin: 0 0 8px;">{{ label('权益清单：', 'Included Features:') }}</p>
                  <ul>
                    <li>{{ label('高速云端资产库双向同步', 'High-speed 2-way cloud asset sync') }}</li>
                    <li>{{ label('企业级私有 NPM 组件分发', 'Private enterprise component distribution') }}</li>
                    <li>{{ label('全套移动端与桌面主题源码', 'Complete source code for mobile and desktop themes') }}</li>
                  </ul>
                </div>
                <template #footer="{ cancel, confirm }">
                  <scq-button @click="cancel(); showNotice(label('稍后考虑', 'Decided later'))">{{ label('稍后考虑', 'Later') }}</scq-button>
                  <scq-button type="success" @click="confirm(); showNotice(label('已提交升级申请', 'Upgraded'))">{{ label('立即升级', 'Upgrade') }}</scq-button>
                </template>
              </scq-modal>
            </template>

            <!-- 场景 D：命令式方法调用 Modal.info / Modal.confirm -->
            <template v-else-if="variant === 'api'">
              <div class="modal-feature-card">
                <div class="modal-feature-card__icon modal-feature-card__icon--emerald">
                  <scq-icon name="check" :size="30" />
                </div>
                <span class="modal-feature-card__title">{{ label('函数式快速调用', 'Imperative API') }}</span>
                <span class="modal-feature-card__desc">{{ label('无需模板显式声明，一行代码直接触发', 'Call Modal.info and Modal.confirm directly in script') }}</span>
              </div>
              <scq-cell-group :title="label('可用方法', 'Methods')" :inset="true">
                <scq-cell :title="label('信息弹框', 'Modal.info')" :value="label('单确认按钮', 'Single action')" is-link @click="triggerApiInfo" />
                <scq-cell :title="label('确认对话框', 'Modal.confirm')" :value="label('双按钮拦截', 'Confirmation')" is-link @click="triggerApiConfirm" />
              </scq-cell-group>
              <div class="mobile-example__body" style="padding: 16px 14px 10px; display: flex; gap: 10px;">
                <scq-button style="flex: 1;" @click="triggerApiInfo">Modal.info</scq-button>
                <scq-button type="primary" style="flex: 1;" @click="triggerApiConfirm">Modal.confirm</scq-button>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </PhonePreview>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { locale } from '../../i18n'
import PhonePreview from '../PhonePreview.vue'
import { useComponentId } from '../../../../src/utils/id'
import { Modal } from 'scq-vue'
import type { TabbarItem } from '../../../../src/components/Tabbar'
import type { ActionSheetItem } from '../../../../src/components/ActionSheet'

const props = defineProps<{ kind: string; variant?: string }>()
const previewId = useComponentId('mobile-preview')
const previewReady = ref(false)
onMounted(() => { previewReady.value = true })

const secondary = computed(() => props.variant === 'states')
const label = (zh: string, en: string) => locale.value === 'zh-CN' ? zh : en
const enabled = ref(true)
const visible = ref(false)
const modalVisible = ref(false)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined

const showNotice = (msg: string) => {
  notice.value = msg
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 2200)
}

const modalNavTitle = computed(() => {
  if (!props.variant) return label('版本通知', 'Update Notice')
  if (props.variant === 'confirm') return label('存储管理', 'Storage')
  if (props.variant === 'slot') return label('会员服务', 'Subscription')
  return label('函数调用', 'API Methods')
})

const triggerApiInfo = () => {
  Modal.info({
    title: label('操作提示', 'Notification'),
    message: label('这是通过 Modal.info 直接调用的移动端提示弹窗。', 'This modal dialog was triggered via Modal.info imperative method.'),
    confirmButtonText: label('我知道了', 'Got it'),
    teleport: `#${previewId}`,
    onConfirm: () => { showNotice(label('已确认提示', 'Confirmed')) },
  })
}

const triggerApiConfirm = () => {
  Modal.confirm({
    title: label('重置安全凭证', 'Reset Credentials'),
    message: label('确认重置当前设备的凭证密钥吗？此操作无法撤销。', 'Are you sure you want to reset current security credentials?'),
    cancelButtonText: label('取消', 'Cancel'),
    confirmButtonText: label('确认重置', 'Reset'),
    teleport: `#${previewId}`,
    onConfirm: () => { showNotice(label('凭证已重置', 'Reset successful')) },
    onCancel: () => { showNotice(label('已取消操作', 'Cancelled')) },
  })
}

const active = ref('home')
const tabItems = computed<TabbarItem[]>(() => [
  { name: 'home', label: label('首页', 'Home'), icon: 'home', dot: secondary.value },
  { name: 'inbox', label: label('消息', 'Inbox'), icon: 'inbox', badge: secondary.value ? undefined : 3 },
  { name: 'profile', label: label('我的', 'Profile'), icon: 'user', disabled: secondary.value },
])

const activeLabel = computed(() => tabItems.value.find((item) => item.name === active.value)?.label || '')

const actions = computed<ActionSheetItem[]>(() => secondary.value
  ? [
      { name: label('上传至云端', 'Upload to cloud'), loading: true },
      { name: label('不可下载', 'Not downloadable'), disabled: true },
      { name: label('快速预览', 'Quick preview'), description: label('在线查看 PDF 正文', 'View PDF online'), icon: 'search' },
    ]
  : [
      { name: label('分享给好友', 'Share to friend'), value: 'share', icon: 'user' },
      { name: label('创建副本', 'Duplicate'), value: 'copy', icon: 'copy' },
      { name: label('重命名文件', 'Rename file'), value: 'edit', icon: 'settings' },
      { name: label('删除该文件', 'Delete file'), value: 'delete', danger: true },
    ])

const onSelect = (action: ActionSheetItem) => {
  showNotice(`${label('已执行', 'Done')}: ${action.name}`)
}
</script>

<style scoped>
.mobile-example {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
}

/* 顶部轻量 Toast 提示 */
.mobile-toast {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 500;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
  pointer-events: none;
  backdrop-filter: blur(8px);
}

.scq-toast-enter-active,
.scq-toast-leave-active {
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.scq-toast-enter-from,
.scq-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* 屏幕完整视图与可滚动区 */
.demo-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.demo-screen__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: 16px;
  scrollbar-width: none;
}

.demo-screen__scroll::-webkit-scrollbar {
  display: none;
}

/* 用户名片卡片 */
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 14px 14px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
  border: 1px solid #bfdbfe;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
}

.user-card__avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ffffff;
  color: #3b82f6;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

.user-card__info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.user-card__name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-card__name {
  font-size: 15.5px;
  font-weight: 700;
  color: #0f172a;
}

.user-card__meta {
  font-size: 11.5px;
  color: #64748b;
}

/* 状态横幅 */
.status-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 14px 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
}

.status-banner__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #22c55e;
  color: #ffffff;
}

.status-banner__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-banner__title {
  font-size: 14px;
  font-weight: 700;
  color: #15803d;
}

.status-banner__desc {
  font-size: 12px;
  color: #166534;
}

/* Tab 页面内部 */
.tab-page {
  padding-top: 10px;
}

/* 数据统计卡片 */
.stat-card {
  margin: 0 14px;
  padding: 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-card__label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.stat-card__num {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 8px 0 4px;
  letter-spacing: -0.02em;
}

.stat-card__tip {
  font-size: 11.5px;
  color: #94a3b8;
}

/* 文件预览卡片 */
.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 14px 14px 16px;
  padding: 22px 16px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  text-align: center;
}

.file-card__badge {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.16);
}

.file-card__title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card__size {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

/* Modal 特性演示卡片 */
.modal-feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 14px 14px 16px;
  padding: 20px 16px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.modal-feature-card__icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 16px;
  margin-bottom: 12px;
}

.modal-feature-card__icon--blue {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.16);
}

.modal-feature-card__icon--amber {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.16);
}

.modal-feature-card__icon--purple {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #9333ea;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.16);
}

.modal-feature-card__icon--emerald {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.16);
}

.modal-feature-card__title {
  font-size: 15.5px;
  font-weight: 700;
  color: #0f172a;
}

.modal-feature-card__desc {
  font-size: 12px;
  line-height: 1.45;
  color: #64748b;
  margin-top: 5px;
}

/* Modal 自定义插槽内容容器 */
.modal-benefit-box {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  margin: 4px 0 10px;
}

.modal-benefit-box ul {
  margin: 0;
  padding-left: 18px;
  text-align: left;
  color: #475569;
  font-size: 12.5px;
  line-height: 1.6;
}
</style>