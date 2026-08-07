<template>
  <div class="scq-chat-message" :class="`is-${role}`">
    <div v-if="shouldShowTime" class="scq-chat-message__time">
      {{ formattedTime }}
    </div>

    <div class="scq-chat-message__body">
      <div v-if="shouldShowAvatar" class="scq-chat-message__avatar" :title="avatarTitle">
        <img v-if="avatar" :src="avatar" :alt="avatarAlt" />
        <span v-else>{{ avatarInitial }}</span>
      </div>

      <div class="scq-chat-message__content">
        <div v-if="shouldShowName" class="scq-chat-message__name">{{ name }}</div>

        <div v-if="shouldShowStatus" class="scq-chat-message__status" :class="`is-${resolvedStatusType}`" role="status">
          <span class="scq-chat-message__status-text">{{ resolvedStatusText }}</span>
          <span v-if="resolvedStatusLoading" class="scq-chat-message__status-indicator" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>

        <div v-if="shouldShowBubble" class="scq-chat-message__bubble" :class="bubbleClasses">
          <div
            v-if="resolvedContentType === 'markdown'"
            class="scq-chat-message__markdown"
            v-html="renderedMarkdown"
          ></div>

          <pre v-else-if="resolvedContentType === 'json'" class="scq-chat-message__code-block"><code class="hljs language-json" v-html="highlightedJson"></code></pre>

          <div v-else-if="resolvedContentType === 'image'" class="scq-chat-message__media">
            <img
              v-if="resolvedMedia.src && !imageLoadFailed"
              class="scq-chat-message__image"
              :src="resolvedMedia.src"
              :alt="resolvedMedia.alt"
              :title="resolvedMedia.title"
              loading="lazy"
              :tabindex="previewable ? 0 : undefined"
              :role="previewable ? 'button' : undefined"
              @click="openImagePreview"
              @keydown.enter="openImagePreview"
              @keydown.space.prevent="openImagePreview"
              @error="handleImageError"
            />
            <div v-else-if="resolvedMedia.src" class="scq-chat-message__image-fallback">
              <span>{{ imageFallbackText }}</span>
            </div>
            <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
          </div>

          <div v-else-if="resolvedContentType === 'video'" class="scq-chat-message__media">
            <video
              v-if="resolvedMedia.src"
              class="scq-chat-message__video"
              :src="resolvedMedia.src"
              :poster="resolvedMedia.poster"
              :controls="resolvedMedia.controls"
              :autoplay="resolvedMedia.autoplay"
              :muted="resolvedMedia.muted"
              :loop="resolvedMedia.loop"
              :preload="resolvedMedia.preload"
              playsinline
            >
              当前浏览器不支持视频播放。
            </video>
            <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
          </div>

          <div v-else class="scq-chat-message__text">{{ renderedText }}</div>
        </div>

        <div v-if="normalizedAttachments.length" class="scq-chat-message__attachments">
          <a
            v-for="attachment in normalizedAttachments"
            :key="attachment.key"
            class="scq-chat-message__attachment"
            :class="[`is-${attachment.type}`, `is-${attachment.status}`]"
            :href="attachment.url || undefined"
            :target="attachment.target"
            :rel="attachment.rel"
            :download="attachment.download"
            :aria-disabled="attachment.url ? undefined : 'true'"
            @click="handleAttachmentClick($event, attachment)"
          >
            <span class="scq-chat-message__attachment-icon" aria-hidden="true">{{ attachment.icon }}</span>
            <span class="scq-chat-message__attachment-main">
              <span class="scq-chat-message__attachment-name">{{ attachment.name }}</span>
              <span class="scq-chat-message__attachment-meta">
                <span>{{ attachment.label }}</span>
                <span v-if="attachment.sizeText">{{ attachment.sizeText }}</span>
                <span v-if="attachment.statusText">{{ attachment.statusText }}</span>
              </span>
              <span v-if="attachment.progress !== null" class="scq-chat-message__attachment-progress">
                <span :style="{ width: `${attachment.progress}%` }"></span>
              </span>
            </span>
          </a>
        </div>

        <div v-if="$slots.actions" class="scq-chat-message__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showImagePreview"
        ref="previewRef"
        class="scq-chat-message__preview"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        @click="closeImagePreview"
        @keydown.esc="closeImagePreview"
      >
        <button type="button" class="scq-chat-message__preview-close" aria-label="关闭预览" @click.stop="closeImagePreview">×</button>
        <img :src="resolvedMedia.src" :alt="resolvedMedia.alt" @click.stop />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import jsonLang from 'highlight.js/lib/languages/json'
import javascriptLang from 'highlight.js/lib/languages/javascript'
import typescriptLang from 'highlight.js/lib/languages/typescript'
import xmlLang from 'highlight.js/lib/languages/xml'
import cssLang from 'highlight.js/lib/languages/css'
import bashLang from 'highlight.js/lib/languages/bash'
import pythonLang from 'highlight.js/lib/languages/python'
import javaLang from 'highlight.js/lib/languages/java'
import csharpLang from 'highlight.js/lib/languages/csharp'
import cppLang from 'highlight.js/lib/languages/cpp'
import goLang from 'highlight.js/lib/languages/go'
import rustLang from 'highlight.js/lib/languages/rust'
import phpLang from 'highlight.js/lib/languages/php'
import sqlLang from 'highlight.js/lib/languages/sql'
import yamlLang from 'highlight.js/lib/languages/yaml'
import markdownLang from 'highlight.js/lib/languages/markdown'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({
  name: 'ChatMessage',
})

hljs.registerLanguage('json', jsonLang)
hljs.registerLanguage('javascript', javascriptLang)
hljs.registerLanguage('js', javascriptLang)
hljs.registerLanguage('typescript', typescriptLang)
hljs.registerLanguage('ts', typescriptLang)
hljs.registerLanguage('html', xmlLang)
hljs.registerLanguage('xml', xmlLang)
hljs.registerLanguage('css', cssLang)
hljs.registerLanguage('bash', bashLang)
hljs.registerLanguage('shell', bashLang)
hljs.registerLanguage('python', pythonLang)
hljs.registerLanguage('java', javaLang)
hljs.registerLanguage('csharp', csharpLang)
hljs.registerLanguage('cpp', cppLang)
hljs.registerLanguage('go', goLang)
hljs.registerLanguage('rust', rustLang)
hljs.registerLanguage('php', phpLang)
hljs.registerLanguage('sql', sqlLang)
hljs.registerLanguage('yaml', yamlLang)
hljs.registerLanguage('markdown', markdownLang)

const codeLanguageAliasMap: Record<string, string> = {
  'c#': 'csharp',
  cs: 'csharp',
  c: 'cpp',
  'c++': 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  golang: 'go',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  zsh: 'bash',
  shell: 'bash',
  'shell-session': 'bash',
  console: 'bash',
  terminal: 'bash',
  powershell: 'bash',
  pwsh: 'bash',
  ps1: 'bash',
  yml: 'yaml',
  jsonc: 'json',
  md: 'markdown',
  vue: 'xml',
  sfc: 'xml',
  jsx: 'javascript',
  tsx: 'typescript',
}

const codeLanguageClassAliasMap: Record<string, string> = {
  sfc: 'vue',
}

const knownFenceLanguages = new Set([
  'bash',
  'c',
  'c#',
  'c++',
  'console',
  'cpp',
  'cs',
  'css',
  'go',
  'golang',
  'html',
  'java',
  'javascript',
  'js',
  'json',
  'jsonc',
  'jsx',
  'markdown',
  'md',
  'php',
  'powershell',
  'ps1',
  'pwsh',
  'py',
  'python',
  'rust',
  'sfc',
  'sh',
  'shell',
  'sql',
  'terminal',
  'ts',
  'tsx',
  'typescript',
  'vue',
  'xml',
  'yaml',
  'yml',
  'zsh',
])

const normalizeCodeLanguage = (language: string): string => {
  const name = language
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
    .replace(/^language-/, '')

  return codeLanguageAliasMap[name] ?? name
}

const normalizeCodeLanguageClass = (language: string): string => {
  const name = language
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
    .replace(/^language-/, '')

  return codeLanguageClassAliasMap[name] ?? name
}

const getCodeLanguageClass = (language: string): string => {
  return language.replace(/[^a-z0-9_-]/g, '')
}

const escapeHtmlAttribute = (raw: string): string => {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const normalizeFenceLanguage = (language: string): string => {
  const rawName = language
    .trim()
    .toLowerCase()
    .replace(/^language-/, '')

  const compactName = rawName.replace(/\s+/g, '')
  if (knownFenceLanguages.has(compactName)) {
    return compactName
  }

  const firstName = rawName.split(/\s+/)[0]
  return knownFenceLanguages.has(firstName) ? firstName : firstName
}

const normalizeFenceBreaks = (raw: string): string => {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/(^|\n)`[ \t]*\n``[ \t]*([a-z][\w#+.-]*)/gi, '$1```$2')
    .replace(/(^|\n)``([a-z][\w#+.-]*)(?=[ \t]*(?:\n|$))/gi, '$1```$2')
    .replace(/```[ \t]*v[ \t]*u(?:[ \t]*\n[ \t]*|[ \t]+)e[ \t]*(?=<|\n|$)/gi, '```vue\n')
    .replace(/([^\n])```([a-z][\w#+.-]*)/gi, '$1\n```$2')
    .replace(/```([a-z][\w#+.-]*)(?=<)/gi, '```$1\n')
    .replace(/([^\n])```(?=(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|\|))/g, '$1\n```')
    .replace(/```(?=(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|\|))/g, '```\n')
    .replace(/([^\n])```[ \t]*(?=\n*$)/g, '$1\n```')
}

const looksLikeJavaCode = (code: string): boolean => {
  return /(^|\n)\s*(?:package\s+[\w.]+;|import\s+java\.|public\s+(?:class|interface|enum|record)\s+\w+|class\s+\w+|\/\/\s*[\w.-]+\.java\b|System\.out\.println\s*\()/m.test(code)
}

const looksLikeFeatureTable = (code: string): boolean => {
  const lines = code
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2 || !lines[0].includes('|')) {
    return false
  }

  const hasTableSeparator = lines.some((line) => /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
  if (!hasTableSeparator) {
    return false
  }

  const header = lines[0]
  return /(功能|说明|描述|参数|字段|用途|示例|备注|名称|类型)/.test(header) && !looksLikeJavaCode(code)
}

const tableSeparatorPattern = /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|*$/

const countTableColumns = (separator: string): number => {
  return separator
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .length
}

const isCompleteTableRow = (line: string, columnCount: number): boolean => {
  const text = line.trim()
  if (!text.startsWith('|') || !text.endsWith('|')) {
    return false
  }

  const pipeCount = (text.match(/\|/g) ?? []).length
  return pipeCount >= columnCount + 1
}

const splitCollapsedTableRows = (line: string): string[] => {
  return line.replace(/\|\|(?=[^|\n])/g, '|\n|').split('\n')
}

const isSingleCellPipeFragment = (line: string): boolean => {
  const text = line.trim()
  return text.startsWith('|') && countTableColumns(text) <= 1
}

const normalizeTableSeparatorLine = (line: string): string => {
  return tableSeparatorPattern.test(line.trim()) ? line.replace(/\|+\s*$/, '|') : line
}

const normalizeMarkdownTableSeparator = (line: string, columnCount: number): string => {
  const cells = getMarkdownTableCells(normalizeTableSeparatorLine(line))

  while (cells.length < columnCount) {
    cells.push('---')
  }

  if (cells.length > columnCount) {
    cells.splice(columnCount)
  }

  return `| ${cells.map((cell) => cell || '---').join(' | ')} |`
}

const getMarkdownTableCells = (line: string): string[] => {
  let text = line.trim()
  if (text.startsWith('|')) {
    text = text.slice(1)
  }
  if (text.endsWith('|')) {
    text = text.slice(0, -1)
  }

  return text.split('|').map((cell) => cell.trim())
}

const splitLeadingTableCell = (cell: string): [string, string] | null => {
  const strongMatch = cell.match(/^(\*\*[^*]+\*\*)\s+(.+)$/)
  if (strongMatch) {
    return [strongMatch[1], strongMatch[2]]
  }

  const compactChineseMatch = cell.match(/^([\u4e00-\u9fa5A-Za-z0-9/&+（）()]{2,8})(提供|展示|包含|支持|用于|包括|显示|返回|管理|统计|查看|配置|生成|创建|发起|导出|同步)(.+)$/)
  if (compactChineseMatch) {
    return [compactChineseMatch[1], `${compactChineseMatch[2]}${compactChineseMatch[3]}`]
  }

  const plainMatch = cell.match(/^([\u4e00-\u9fa5A-Za-z0-9/&+（）()]{2,12})\s+(.+)$/)
  if (plainMatch) {
    return [plainMatch[1], plainMatch[2]]
  }

  return null
}

const normalizeMarkdownTableRow = (line: string, columnCount: number): string => {
  const cells = getMarkdownTableCells(line)

  while (cells.length > columnCount && cells[cells.length - 1] === '') {
    cells.pop()
  }

  const firstCellSplit = splitLeadingTableCell(cells[0] ?? '')
  const secondCellLooksLikeStatus = /^(?:✅|❌|⚠️|是|否|支持|不支持)/.test(cells[1] ?? '')
  if (firstCellSplit && cells.length >= columnCount && secondCellLooksLikeStatus) {
    cells.splice(0, 1, ...firstCellSplit)
  }

  while (cells.length < columnCount) {
    if (cells.length === columnCount - 1) {
      const splitCells = splitLeadingTableCell(cells[0] ?? '')
      if (splitCells) {
        cells.splice(0, 1, ...splitCells)
      } else {
        cells.unshift('')
      }
      continue
    }

    cells.unshift('')
  }

  if (cells.length > columnCount) {
    const mergedTail = cells.slice(columnCount - 1).filter(Boolean).join(' | ')
    cells.splice(columnCount - 1, cells.length - columnCount + 1, mergedTail)
  }

  return `| ${cells.join(' | ')} |`
}

const isLikelyTableRowLine = (line: string): boolean => {
  const text = line.trim()
  if (!text) {
    return false
  }

  return text.startsWith('|') || tableSeparatorPattern.test(text) || /^[-*+]\s+[^|\n]+\|/.test(text)
}

const normalizePotentialTableRowLine = (line: string): string => {
  const text = line.trim()
  if (/^[-*+]\s+[^|\n]+\|/.test(text)) {
    return line.replace(/^([ \t]*)[-*+][ \t]+/, '$1')
  }

  return line
}

const mergeMarkdownTableContinuationRows = (rows: string[], columnCount: number): string[] => {
  const mergedRows: string[] = []
  const tableStatusCellPattern = /^(?:✅|❌|⚠️|是|否|支持|不支持|部分支持|⚠️\s*部分支持)/

  rows.forEach((row) => {
    const previousIndex = mergedRows.length - 1
    const previous = mergedRows[previousIndex] ?? ''
    const cells = getMarkdownTableCells(row)
    const firstCell = cells[0] ?? ''
    if (cells.every((cell) => !cell)) {
      return
    }

    const hasContinuationShape = Boolean(previous && cells.length <= columnCount && firstCell && !cells.slice(1).some(Boolean))

    if (hasContinuationShape && hasUnclosedParenthesis(previous)) {
      const previousCells = getMarkdownTableCells(previous)
      const previousTail = previousCells[columnCount - 1] ?? ''
      const separator = previousTail && !/[（(]$/.test(previousTail) && !/^[），)、，。；：:]/.test(firstCell) && !/[\u4e00-\u9fa5]$/.test(previousTail) && !/^[\u4e00-\u9fa5]/.test(firstCell) ? ' ' : ''
      previousCells[columnCount - 1] = `${previousTail}${separator}${firstCell}`
      mergedRows[previousIndex] = `| ${previousCells.slice(0, columnCount).join(' | ')} |`
      return
    }

    const hasStatusContinuationShape = Boolean(columnCount >= 4 && previous && tableStatusCellPattern.test(firstCell) && cells[1] && !cells.slice(2).some(Boolean))
    if (hasStatusContinuationShape) {
      const previousCells = getMarkdownTableCells(previous)
      const abilityIndex = columnCount - 3
      const statusIndex = columnCount - 2
      const noteIndex = columnCount - 1

      if (previousCells[statusIndex] && !tableStatusCellPattern.test(previousCells[statusIndex]) && !previousCells[noteIndex]) {
        previousCells[abilityIndex] = appendTableCellText(previousCells[abilityIndex] ?? '', previousCells[statusIndex])
        previousCells[statusIndex] = ''
      }

      if (!previousCells[statusIndex] && !previousCells[noteIndex]) {
        previousCells[statusIndex] = firstCell
        previousCells[noteIndex] = cells.slice(1).filter(Boolean).join(' | ')
        mergedRows[previousIndex] = `| ${previousCells.slice(0, columnCount).join(' | ')} |`
        return
      }
    }

    mergedRows.push(row)
  })

  return mergedRows
}

const isLikelyTableTailNote = (line: string): boolean => {
  const text = line
    .trim()
    .replace(/^\|+\s*/, '')
    .replace(/\s*\|+$/, '')
    .trim()

  return /^(?:(?:✅|❌|⚠️?)\s*(?:=|总结|注[:：]|说明[:：])|注[:：]|说明[:：]|如需|是否需要|以上|总结[:：])/.test(text)
}

const removeOrphanTablePipe = (line: string): string => {
  const text = line.trim()
  if (!text || text.startsWith('|') || !text.endsWith('|')) {
    return line
  }

  const pipeCount = (text.match(/\|/g) ?? []).length
  return pipeCount === 1 ? line.replace(/\s*\|\s*$/, '') : line
}

const normalizeTableCandidateLines = (lines: string[]): string[] => {
  const normalizedLines: string[] = []

  lines.forEach((line) => {
    const trimmed = line.trim()
    const previousIndex = normalizedLines.length - 1
    const previous = normalizedLines[previousIndex] ?? ''

    if (!trimmed && previous && (previous.trim().startsWith('|') || /^\|?[-:|\s]+$/.test(previous.trim())) && (!previous.trim().endsWith('|') || isSingleCellPipeFragment(previous))) {
      return
    }

    if (previous.trim() === '|' && trimmed) {
      normalizedLines[previousIndex] = trimmed.startsWith('|') ? `| ${trimmed}` : `|${line}`
      return
    }

    const shouldJoinPipeFragment = Boolean(previous && previous.trim().startsWith('|') && !previous.trim().endsWith('|') && trimmed.startsWith('|'))
    const shouldJoinSingleCellPipeFragment = Boolean(previous && isSingleCellPipeFragment(previous) && trimmed.startsWith('|'))
    const shouldJoinSeparatorFragment = Boolean(previous && /^\|?[-:|\s]+$/.test(previous.trim()) && /^\|?[-:|\s]+$/.test(trimmed))
    const shouldJoinPrevious = Boolean(
      previous &&
      !previous.trim().endsWith('|') &&
      !trimmed.startsWith('|') &&
      trimmed &&
      (previous.includes('|') || /^:?-{2,}:?$/.test(previous.trim()) || /^[-:|\s]+$/.test(previous.trim()))
    )

    if (shouldJoinSingleCellPipeFragment) {
      normalizedLines[previousIndex] = `${previous.replace(/\|\s*$/, '| ')}${trimmed.replace(/^\|/, '')}`
      return
    }

    if (shouldJoinPipeFragment || shouldJoinSeparatorFragment || shouldJoinPrevious) {
      normalizedLines[previousIndex] = `${previous}${trimmed}`
      return
    }

    normalizedLines.push(line)
  })

  return normalizedLines
}

const splitInlineTableStartLines = (raw: string): string[] => {
  const result: string[] = []

  raw.split('\n').forEach((line) => {
    const inlineTableStart = line.match(/^(.+?)(\|\s*[^|\n]+\s*(?:\|\s*[^|\n]+\s*){2,}\|\s*)$/)
    if (inlineTableStart && !inlineTableStart[1].includes('|')) {
      result.push(inlineTableStart[1].trimEnd(), '', inlineTableStart[2])
      return
    }

    result.push(line)
  })

  return result
}

const splitCollapsedInlineTableText = (raw: string): string => {
  return raw
    .replace(/\|\s+(?=(?:\|?\s*:?-{3,}:?\s*){2,}\|)/g, '|\n')
    .replace(/((?:\|\s*:?-{3,}:?\s*){2,}\|)\s+(?=\|)/g, '$1\n')
    .replace(/\|\|\s*\|\s*(?=[^|\n])/g, '|\n| | ')
    .replace(/\|{2,}\s+(?=\|?[\u4e00-\u9fa5A-Za-z0-9✅❌⚠️*`<])/g, '|\n|')
    .replace(/\|\s+(?=\|(?:\*\*|`|[\u4e00-\u9fa5A-Za-z0-9✅❌⚠️<]))/g, '|\n')
}

const fragmentedFeatureTableHeaderPattern = /^(?:类别\s*)?功能模块$/
const fragmentedFeatureTableCategoryPattern = /^(术者管理|学习旅程支持|毕业与能力认证|互动与记录|数据洞察与报表|通知提醒)(.+)$/

const appendTableCellText = (value: string, addition: string): string => {
  if (!value) {
    return addition
  }

  const separator = /[\u4e00-\u9fa5]$/.test(value) || /^[\u4e00-\u9fa5，。；：、）)]/.test(addition) ? '' : ' '
  return `${value}${separator}${addition}`
}

const repairFragmentedFeatureTable = (raw: string): string => {
  const lines = raw.split('\n')
  const isIgnorableHeaderLine = (line: string): boolean => {
    const text = line.trim()
    return !text || /^\|+$/.test(text) || tableSeparatorPattern.test(text) || /^\|?[-:|\s]+\|?$/.test(text)
  }
  const findNextHeaderLineIndex = (startIndex: number): number => {
    for (let index = startIndex; index < lines.length; index += 1) {
      if (!isIgnorableHeaderLine(lines[index])) {
        return index
      }
    }

    return -1
  }
  let headerStartIndex = -1
  let headerEndIndex = -1

  for (let index = 0; index < lines.length; index += 1) {
    const first = lines[index].trim()
    const moduleIndex = first === '类别' ? findNextHeaderLineIndex(index + 1) : index
    const abilityIndex = findNextHeaderLineIndex(moduleIndex + 1)
    const supportIndex = findNextHeaderLineIndex(abilityIndex + 1)
    const noteIndex = findNextHeaderLineIndex(supportIndex + 1)

    if (moduleIndex >= 0 && abilityIndex >= 0 && supportIndex >= 0 && noteIndex >= 0 && fragmentedFeatureTableHeaderPattern.test(lines[moduleIndex].trim()) && lines[abilityIndex].trim() === '具体能力' && /^是否支持/.test(lines[supportIndex].trim()) && lines[noteIndex].trim() === '补充说明') {
      headerStartIndex = first === '类别' ? index : moduleIndex
      headerEndIndex = noteIndex
      break
    }
  }

  if (headerStartIndex < 0 || headerEndIndex < 0) {
    return raw
  }

  const result = lines.slice(0, headerStartIndex)
  const rows: string[][] = []
  const tailLines: string[] = []
  let currentCategory = ''
  let pendingCategory = ''
  let pendingCells: string[] = []
  let inTail = false

  const appendPendingCells = (cells: string[]) => {
    if (!cells.length) {
      return
    }

    if (!pendingCells.length) {
      const firstCell = cells[0].replace(/^[-*+][ \t]+/, '').trim()
      const splitCategory = firstCell.match(fragmentedFeatureTableCategoryPattern)
      if (splitCategory) {
        currentCategory = splitCategory[1]
        pendingCategory = splitCategory[1]
        pendingCells = [splitCategory[2], ...cells.slice(1)]
        return
      }

      pendingCategory = currentCategory
      pendingCells = [firstCell, ...cells.slice(1)]
      return
    }

    pendingCells.push(...cells)
  }

  const flushPendingRow = () => {
    if (pendingCells.length < 4) {
      return
    }

    rows.push([
      pendingCategory || currentCategory,
      pendingCells[0] ?? '',
      pendingCells[1] ?? '',
      pendingCells[2] ?? '',
      pendingCells.slice(3).filter(Boolean).join(' | '),
    ])
    pendingCells = []
    pendingCategory = ''
  }

  for (let index = headerEndIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim().replace(/^[-*+][ \t]+(?=\S)/, '')

    if (inTail) {
      tailLines.push(line)
      continue
    }

    if (!trimmed || trimmed === '|' || /^\|+$/.test(trimmed) || tableSeparatorPattern.test(trimmed) || /^\|?[-:|\s]+\|?$/.test(trimmed)) {
      continue
    }

    if (/^(?:✅\s*)?(?:总结|简言之)|^如需|^需要我|^欢迎/.test(trimmed)) {
      flushPendingRow()
      inTail = true
      tailLines.push(line)
      continue
    }

    if (!trimmed.includes('|')) {
      if (pendingCells.length) {
        const lastIndex = pendingCells.length - 1
        pendingCells[lastIndex] = appendTableCellText(pendingCells[lastIndex] ?? '', trimmed)
        continue
      }

      const splitCategory = trimmed.match(fragmentedFeatureTableCategoryPattern)
      currentCategory = splitCategory ? splitCategory[1] : trimmed
      if (splitCategory?.[2]) {
        pendingCategory = splitCategory[1]
        pendingCells = [splitCategory[2]]
      }
      continue
    }

    let cells = getMarkdownTableCells(trimmed).map((cell) => cell.replace(/^[-*+][ \t]+/, '').trim())
    while (cells.length && !cells[0]) {
      cells = cells.slice(1)
    }

    if (!cells.length) {
      continue
    }

    if (cells.length >= 5) {
      flushPendingRow()
      const category = cells[0] || currentCategory
      rows.push([category, cells[1], cells[2], cells[3], cells.slice(4).filter(Boolean).join(' | ')])
      currentCategory = category || currentCategory
      continue
    }

    appendPendingCells(cells)
    flushPendingRow()
  }

  flushPendingRow()

  if (rows.length < 2) {
    return raw
  }

  const normalizedRows = mergeMarkdownTableContinuationRows(
    rows.map((row) => `| ${row.map((cell) => cell || '').join(' | ')} |`),
    5,
  ).map((row) => getMarkdownTableCells(row))

  result.push('| 类别 | 功能模块 | 具体能力 | 是否支持PE | 补充说明 |')
  result.push('|---|---|---|---|---|')
  normalizedRows.forEach((row) => {
    result.push(`| ${row.map((cell) => cell || '').join(' | ')} |`)
  })

  if (tailLines.length) {
    result.push('', ...tailLines)
  }

  return result.join('\n')
}

const capabilityTableHeaderPattern = /功能模块.*具体能力.*是否支持.*备注说明/

const repairFragmentedCapabilityTable = (raw: string): string => {
  const lines = raw.split('\n')
  const headerIndex = lines.findIndex((line) => line.includes('|') && capabilityTableHeaderPattern.test(line))

  if (headerIndex < 0) {
    return raw
  }

  const result = lines.slice(0, headerIndex)
  const rows: string[][] = []
  const tailLines: string[] = []
  const statusPattern = /^(?:✓|✔|✅|✗|✘|❌|是|否|支持|不支持|部分支持)/
  let currentModule = ''
  let abilityParts: string[] = []
  let status = ''
  let noteParts: string[] = []
  let inTail = false
  let expectModuleLine = true

  const appendAbility = (value: string) => {
    if (value) {
      abilityParts.push(value)
      expectModuleLine = false
    }
  }

  const appendNote = (value: string) => {
    if (value) {
      noteParts.push(value)
    }
  }

  const flushRow = () => {
    if (!currentModule || (!abilityParts.length && !status && !noteParts.length)) {
      return
    }

    rows.push([currentModule, abilityParts.join(''), status, noteParts.join('')])
    abilityParts = []
    status = ''
    noteParts = []
    expectModuleLine = true
  }

  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim().replace(/^[-*+][ \t]+(?=\S)/, '')

    if (inTail) {
      tailLines.push(line)
      continue
    }

    if (!trimmed || trimmed === '|' || tableSeparatorPattern.test(trimmed) || /^\|?[-:|\s]+\|?$/.test(trimmed)) {
      continue
    }

    if (/^(?:✅\s*)?(?:总结|简言之)|^如需|^需要我|^欢迎|^以上/.test(trimmed)) {
      flushRow()
      inTail = true
      tailLines.push(line)
      continue
    }

    if (!trimmed.includes('|')) {
      if (!currentModule || expectModuleLine || (abilityParts.length || status || noteParts.length) && status) {
        flushRow()
        currentModule = trimmed
        expectModuleLine = false
        continue
      }

      appendAbility(trimmed)
      continue
    }

    let cells = getMarkdownTableCells(trimmed).map((cell) => cell.replace(/^[-*+][ \t]+/, '').trim())
    while (cells.length && !cells[0]) {
      cells = cells.slice(1)
    }

    if (!cells.length) {
      continue
    }

    if (cells.length >= 4) {
      flushRow()
      currentModule = cells[0] || currentModule
      abilityParts = [cells[1] ?? ''].filter(Boolean)
      status = cells[2] ?? ''
      noteParts = cells.slice(3).filter(Boolean)
      flushRow()
      continue
    }

    if (cells.length === 3 && statusPattern.test(cells[1])) {
      appendAbility(cells[0])
      status = cells[1]
      appendNote(cells[2])
      flushRow()
      continue
    }

    if (cells.length === 3 && statusPattern.test(cells[2])) {
      flushRow()
      currentModule = cells[0] || currentModule
      abilityParts = [cells[1] ?? ''].filter(Boolean)
      status = cells[2]
      continue
    }

    if (cells.length === 2 && statusPattern.test(cells[0])) {
      status = cells[0]
      appendNote(cells[1])
      flushRow()
      continue
    }

    if (cells.length === 2 && statusPattern.test(cells[1])) {
      appendAbility(cells[0])
      status = cells[1]
      continue
    }

    cells.forEach(appendAbility)
  }

  flushRow()

  if (!rows.length) {
    return raw
  }

  result.push('| 功能模块 | 具体能力/操作 | 是否支持 | 备注说明 |')
  result.push('|---|---|---|---|')
  rows.forEach((row) => {
    result.push(`| ${row.map((cell) => cell || '').join(' | ')} |`)
  })

  if (tailLines.length) {
    result.push('', ...tailLines)
  }

  return result.join('\n')
}

const numberedCapabilityTableHeaderPattern = /序号.*功能模块.*具体能力.*是否.*备注说明/

const repairFragmentedNumberedCapabilityTable = (raw: string): string => {
  const lines = raw.split('\n')
  const headerIndex = lines.findIndex((line) => numberedCapabilityTableHeaderPattern.test(line.replace(/\|/g, '')) || line.trim() === '序号')

  if (headerIndex < 0) {
    return raw
  }

  const result = lines.slice(0, headerIndex)
  const rows: string[][] = []
  const statusPattern = /^(?:✅|❌|⚠️|✓|✔|✗|✘|是|否|支持|不支持|可|不可|部分)/
  let number = ''
  let module = ''
  let abilityParts: string[] = []
  let status = ''
  let noteParts: string[] = []
  let headerSeen = numberedCapabilityTableHeaderPattern.test(lines[headerIndex].replace(/\|/g, ''))

  const flushRow = () => {
    if (!number || !module || (!abilityParts.length && !status && !noteParts.length)) {
      return
    }

    rows.push([number, module, abilityParts.join(''), status, noteParts.join('')])
    module = ''
    abilityParts = []
    status = ''
    noteParts = []
  }

  const startNumber = (value: string) => {
    flushRow()
    number = value
  }

  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim().replace(/^[-*+][ \t]+(?=\S)/, '')

    if (!headerSeen) {
      headerSeen = trimmed === '备注说明'
      continue
    }

    if (!trimmed || trimmed === '|' || /^\|+$/.test(trimmed) || tableSeparatorPattern.test(trimmed) || /^\|?[-:|\s]+\|?$/.test(trimmed)) {
      continue
    }

    if (/^(?:✅\s*)?(?:总结|简言之)|^如需|^需要我|^欢迎|^以上/.test(trimmed)) {
      break
    }

    const plainNumber = trimmed.match(/^\|?\s*(\d+)\s*\|?$/)
    if (plainNumber) {
      startNumber(plainNumber[1])
      continue
    }

    if (!trimmed.includes('|')) {
      if (!module) {
        module = trimmed
      } else if (status) {
        noteParts.push(trimmed)
      } else {
        abilityParts.push(trimmed)
      }
      continue
    }

    let cells = getMarkdownTableCells(trimmed).map((cell) => cell.replace(/^[-*+][ \t]+/, '').trim()).filter(Boolean)
    if (!cells.length) {
      continue
    }

    const firstNumber = cells[0].match(/^\d+$/)
    if (firstNumber) {
      startNumber(firstNumber[0])
      cells = cells.slice(1)
    }

    const statusIndex = cells.findIndex((cell) => statusPattern.test(cell))
    if (statusIndex >= 0) {
      if (!module && statusIndex > 0) {
        module = cells[0]
        abilityParts.push(...cells.slice(1, statusIndex))
      } else {
        abilityParts.push(...cells.slice(0, statusIndex))
      }
      status = cells[statusIndex]
      noteParts.push(...cells.slice(statusIndex + 1))
      flushRow()
      continue
    }

    if (!module) {
      module = cells[0]
      abilityParts.push(...cells.slice(1))
    } else {
      abilityParts.push(...cells)
    }
  }

  flushRow()

  if (!rows.length) {
    return raw
  }

  result.push('| 序号 | 功能模块 | 具体能力 | 是否可编辑/操作 | 备注说明 |')
  result.push('|---|---|---|---|---|')
  rows.forEach((row) => {
    result.push(`| ${row.map((cell) => cell || '').join(' | ')} |`)
  })

  return result.join('\n')
}

const repairFeatureTableStatusContinuations = (raw: string): string => {
  const lines = raw.split('\n')
  const result: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const nextLine = lines[index + 1]

    if (nextLine && tableSeparatorPattern.test(nextLine.trim()) && getMarkdownTableCells(line).length === 5) {
      const tableLines = [line, nextLine]
      index += 2

      while (index < lines.length) {
        const tableLine = lines[index]
        if (!tableLine.trim() || !tableLine.includes('|')) {
          break
        }

        tableLines.push(tableLine)
        index += 1
      }

      const header = normalizeMarkdownTableRow(tableLines[0], 5)
      const separator = normalizeMarkdownTableSeparator(tableLines[1], 5)
      const rows = tableLines.slice(2).map((row) => normalizeMarkdownTableRow(row, 5))
      result.push(header, separator, ...mergeMarkdownTableContinuationRows(rows, 5))
      continue
    }

    result.push(line)
    index += 1
  }

  return result.join('\n')
}

const repairMarkdownTableLines = (raw: string): string => {
  const prepared = repairFragmentedNumberedCapabilityTable(repairFragmentedCapabilityTable(repairFragmentedFeatureTable(raw)))
    .replace(/\|\|(?=\s*:?-{3,}:?\s*\|)/g, '|\n|')
    .replace(/((?:\|\s*:?-{3,}:?\s*)+\|)\|(?=[^\n|])/g, '$1\n|')
    .replace(/\|---(?=[^|\n]*[\u4e00-\u9fa5A-Za-z])/g, '---')
  const expanded = splitCollapsedInlineTableText(prepared)
  const lines = normalizeTableCandidateLines(splitInlineTableStartLines(expanded))
  const result: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const nextLine = lines[index + 1]

    if (nextLine && tableSeparatorPattern.test(nextLine.trim()) && line.includes('|')) {
      const headerColumnCount = getMarkdownTableCells(line.trim().startsWith('|') ? line : `|${line}`).length
      const separatorColumnCount = countTableColumns(nextLine)
      const columnCount = Math.max(headerColumnCount, separatorColumnCount)
      const normalizedSeparator = normalizeMarkdownTableSeparator(nextLine, columnCount)
      if (result.length && result[result.length - 1].trim()) {
        result.push('')
      }

      result.push(normalizeMarkdownTableRow(line.trim().startsWith('|') ? line : `|${line}`, columnCount))
      result.push(normalizedSeparator)
      index += 2

      let pendingRow = ''
      const tableRows: string[] = []
      while (index < lines.length) {
        const tableLine = lines[index]
        if (!tableLine.trim()) {
          if (pendingRow && isSingleCellPipeFragment(pendingRow)) {
            index += 1
            continue
          }

          break
        }

        if (isLikelyTableTailNote(tableLine)) {
          break
        }

        if (!pendingRow && lines[index + 1] && tableSeparatorPattern.test(lines[index + 1].trim()) && tableLine.includes('|')) {
          break
        }

        if (pendingRow && tableLine.trim().startsWith('|') && lines[index + 1] && tableSeparatorPattern.test(lines[index + 1].trim())) {
          if (countTableColumns(normalizeTableSeparatorLine(lines[index + 1])) !== columnCount) {
            break
          }

          lines[index] = `${pendingRow}${tableLine.trim()}`
          pendingRow = ''
          break
        }

        if (!pendingRow && !isLikelyTableRowLine(tableLine) && lines[index + 1]?.trim().startsWith('|')) {
          pendingRow = `| ${tableLine.trim()}`
          index += 1
          continue
        }

        if (!pendingRow && !isLikelyTableRowLine(tableLine)) {
          break
        }

        if (pendingRow && !isLikelyTableRowLine(tableLine) && /^(?:[✅❌⚠️💡]|注[:：]|说明[:：]|如需)/.test(tableLine.trim())) {
          break
        }

        const normalizedTableLine = normalizePotentialTableRowLine(tableLine)
        const rowSource = !pendingRow && normalizedTableLine.includes('|') && !normalizedTableLine.trim().startsWith('|') ? `|${normalizedTableLine}` : normalizedTableLine
        splitCollapsedTableRows(rowSource).forEach((part) => {
          if (!part) {
            return
          }

          pendingRow += pendingRow ? part : part
          if (isCompleteTableRow(pendingRow, columnCount)) {
            tableRows.push(normalizeMarkdownTableRow(pendingRow, columnCount))
            pendingRow = ''
          }
        })

        index += 1
      }

      if (pendingRow) {
        tableRows.push(normalizeMarkdownTableRow(pendingRow, columnCount))
      }

      result.push(...mergeMarkdownTableContinuationRows(tableRows, columnCount))

      continue
    }

    result.push(removeOrphanTablePipe(line))
    index += 1
  }

  return repairFeatureTableStatusContinuations(result.join('\n'))
}

const repairMarkdownTablesOutsideFences = (raw: string): string => {
  const lines = raw.split('\n')
  const result: string[] = []
  let outsideFenceLines: string[] = []
  let inFence = false

  const flushOutsideFence = () => {
    if (!outsideFenceLines.length) {
      return
    }

    result.push(...repairMarkdownTableLines(outsideFenceLines.join('\n')).split('\n'))
    outsideFenceLines = []
  }

  lines.forEach((line) => {
    if (/^```/.test(line.trim())) {
      if (inFence) {
        result.push(line)
        inFence = false
        return
      }

      flushOutsideFence()
      result.push(line)
      inFence = true
      return
    }

    if (inFence) {
      result.push(line)
      return
    }

    outsideFenceLines.push(line)
  })

  flushOutsideFence()
  return result.join('\n')
}

const isMarkdownStructureLine = (line: string): boolean => {
  const text = line.trim()
  return Boolean(
    !text ||
    /^```/.test(text) ||
    /^#{1,6}\s/.test(text) ||
    /^[-*+]\s+/.test(text) ||
    /^\d+\.\s+/.test(text) ||
    /^>\s?/.test(text) ||
    /^-{3,}$/.test(text) ||
    /^\|/.test(text) ||
    tableSeparatorPattern.test(text)
  )
}

const shouldMergeSoftBreak = (previous: string, next: string): boolean => {
  const previousText = previous.trimEnd()
  const nextText = next.trimStart()

  if (!previousText || !nextText || isMarkdownStructureLine(previousText) || isMarkdownStructureLine(nextText)) {
    return false
  }

  if (/[。！？；：.!?;:]$/.test(previousText) && !/^[，、）)。：:]/.test(nextText)) {
    return false
  }

  return true
}

const repairSoftBreakLines = (raw: string): string => {
  const lines = raw.split('\n')
  const result: string[] = []
  let inFence = false

  lines.forEach((line) => {
    if (/^```/.test(line.trim())) {
      result.push(line)
      inFence = !inFence
      return
    }

    if (inFence || !result.length) {
      result.push(line)
      return
    }

    const previousIndex = result.length - 1
    const previous = result[previousIndex]
    if (shouldMergeSoftBreak(previous, line)) {
      const separator = /[\u4e00-\u9fa5]$/.test(previous.trimEnd()) || /^[\u4e00-\u9fa5，、。！？；：]/.test(line.trimStart()) ? '' : ' '
      result[previousIndex] = `${previous.trimEnd()}${separator}${line.trimStart()}`
      return
    }

    result.push(line)
  })

  return result.join('\n')
}

const normalizeOutsideFencedCodeBlocks = (raw: string, normalize: (content: string) => string): string => {
  const lines = raw.split('\n')
  const result: string[] = []
  let outsideFenceLines: string[] = []
  let inFence = false

  const flushOutsideFence = () => {
    if (!outsideFenceLines.length) {
      return
    }

    result.push(...normalize(outsideFenceLines.join('\n')).split('\n'))
    outsideFenceLines = []
  }

  lines.forEach((line) => {
    if (/^```/.test(line.trim())) {
      if (inFence) {
        result.push(line)
        inFence = false
        return
      }

      flushOutsideFence()
      result.push(line)
      inFence = true
      return
    }

    if (inFence) {
      result.push(line)
      return
    }

    outsideFenceLines.push(line)
  })

  flushOutsideFence()
  return result.join('\n')
}

const structuralEmojiMarkerSource = '(?:✅|❌|⚠️?|🔍|📌|👉|❓|🔹)'
const structuralEmojiMarkerPattern = new RegExp(`([^\\s\\n])([ \\t]*)(${structuralEmojiMarkerSource})(?=[ \\t]*(?:\\*\\*|["“'(<（\\u4e00-\\u9fa5A-Za-z0-9]))`, 'g')
const inlineMarkdownListMarkerPattern = new RegExp(`([^\\s\\n])([ \\t]*)([-*+])[ \\t]*(?=${structuralEmojiMarkerSource}|\\*\\*|[\\u4e00-\\u9fa5])`, 'g')
const inlineMarkdownOrderedListMarkerPattern = new RegExp(`([^\\s\\n])([ \\t]*)(\\d{1,3}\\.[ \\t]+)(?=${structuralEmojiMarkerSource}|\\*\\*|[\\u4e00-\\u9fa5A-Z])`, 'g')
const lineStartEmojiListMarkerPattern = new RegExp(`(^|\\n)([-*+])[ \\t]*(?=${structuralEmojiMarkerSource})`, 'g')

const repairSplitStrongMarkersSegment = (raw: string): string => {
  return raw
    .replace(/\*[ \t]*\n(?:[ \t]*\n)*[ \t]*\*/g, '**')
    .replace(/\*\*[ \t]+(?=\S)/g, '**')
    .replace(/(?<=\S)[ \t]+\*\*/g, '**')
    .replace(/\*\*[ \t\n]+([^*\n][\s\S]{0,220}?[^\s*])[ \t\n]*\*\*/g, '**$1**')
    .replace(/((?:✅|❌|⚠️?|🔍|📌|👉|❓|🔹))[ \t]*\*[ \t]*(?:\n[ \t]*)+(?:[-*+][ \t]*)?([^\s*\n][^\n]{0,220}?\*\*)/g, (_match: string, marker: string, text: string) => `${marker} **${text}`)
    .replace(new RegExp(`(${structuralEmojiMarkerSource})[ \\t]*\\*[ \\t]*\\n(?:[ \\t]*\\n)*[ \\t]*[-*+]?[ \\t]*([^\\s*\\n][^\\n]{0,160}?\\*\\*)`, 'g'), (_match: string, marker: string, text: string) => `${marker} **${text}`)
    .replace(/([^\s*])\*[ \t]*\n(?:[ \t]*\n)*[ \t]*[-*+]?[ \t]*([^\s*\n][^\n]{0,160}?\*\*)/g, (_match: string, previous: string, text: string) => `${previous}**${text}`)
    .replace(/(\*\*[^*\n]+)\*[ \t]*\n(?:[ \t]*\n)*[ \t]*[-*+]?[ \t]*([^\s*])/g, (_match: string, text: string, next: string) => `${text}**${next}`)
    .replace(/([\u4e00-\u9fa5])\*(?=\d{1,2}[.．]\s*[【\u4e00-\u9fa5])/g, '$1\n')
    .replace(/(^|\n|[。！？；：:][ \t]*)([-+][ \t]*)?([A-Za-z\u4e00-\u9fa5]{2,12})\*\*(?=[：:])/g, (_match: string, prefix: string, listMarker: string = '', label: string) => `${prefix}${listMarker}**${label}**`)
    .replace(/(^|[^\w\u4e00-\u9fa5*])\*(?=[【“"（(\u4e00-\u9fa5A-Za-z0-9])/g, '$1')
    .replace(/([】）)\u4e00-\u9fa5A-Za-z0-9])\*(?=$|[，。；：、,.!?;:\s\n])/g, '$1')
}

const repairSplitStrongMarkers = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, repairSplitStrongMarkersSegment)
}

const removeOrphanMarkdownMarkersSegment = (raw: string): string => {
  return raw
    .split('\n')
    .map((line) => {
      let normalizedLine = line
      if (/^[ \t]*[-*+][ \t]*[^*\n]+\*\*/.test(normalizedLine)) {
        normalizedLine = normalizedLine.replace(/^([ \t]*)[-*+][ \t]+/, '$1')
      }

      if (/^[ \t]*[-*+][ \t]*(?:的|相关|专业|专属|业务|操作|流程|角色|文档|我懂|需要|该|此|这)/.test(normalizedLine)) {
        normalizedLine = normalizedLine.replace(/^([ \t]*)[-*+][ \t]+/, '$1')
      }

      if (/^[ \t]*\*[ \t]+.*\*[ \t]*$/.test(normalizedLine)) {
        normalizedLine = normalizedLine.replace(/^([ \t]*)\*[ \t]+/, '$1')
      }

      if (!/^[ \t]*\*[ \t]+\S/.test(normalizedLine)) {
        normalizedLine = normalizedLine
          .replace(/\*\*([≥≤=<>0-9][^*\n]{0,120}?)\*\*/g, '$1')
          .replace(/(^|[^*])\*(?![*\s])/g, '$1')
          .replace(/([^*\s])\*(?=$|[\s，。；：、,.!?;:])/g, '$1')
      }

      const strongMarkerCount = (normalizedLine.match(/\*\*/g) ?? []).length
      if (strongMarkerCount % 2 === 1) {
        normalizedLine = normalizedLine.replace(/\*\*/g, '')
      }

      return normalizedLine
    })
    .join('\n')
}

const removeOrphanMarkdownMarkers = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, removeOrphanMarkdownMarkersSegment)
}

const normalizeSplitDomainTermsSegment = (raw: string): string => {
  return raw
    .replace(/\bP[ \t\n]+FA\b/g, 'PFA')
    .replace(/\bP[ \t\n]+VI(?=\+?\b|\+)/g, 'PVI')
    .replace(/\bU[ \t\n]+AT\b/g, 'UAT')
}

const normalizeSplitDomainTerms = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, normalizeSplitDomainTermsSegment)
}

const normalizeSplitHtmlTagBreaks = (raw: string): string => {
  return raw
    .replace(/<\s*\n\s*(\/?\s*(?:template|script|style)\b)/gi, '<$1')
    .replace(/<(template|script|style)([^>\n]*?)\n\s*([^>\n]*?)>/gi, '<$1$2 $3>')
    .replace(/<\/(template|script|style)(?!\s*>)(?=\s*<(?:\/?(?:template|script|style)\b))/gi, '</$1>\n')
    .replace(/<\/(template|script|style)\s*(?=\n\s*<(?:\/?(?:template|script|style)\b))/gi, '</$1>')
}

const hasUnclosedParenthesis = (text: string): boolean => {
  const lastChineseOpen = text.lastIndexOf('（')
  const lastChineseClose = text.lastIndexOf('）')
  const lastEnglishOpen = text.lastIndexOf('(')
  const lastEnglishClose = text.lastIndexOf(')')
  return lastChineseOpen > lastChineseClose || lastEnglishOpen > lastEnglishClose
}

const repairParentheticalListMarkersSegment = (raw: string): string => {
  const lines = raw.split('\n')
  let pendingParentheticalText = ''

  return lines
    .map((line) => {
      const trimmed = line.trim()
      const shouldUnwrapListMarker = Boolean(pendingParentheticalText && hasUnclosedParenthesis(pendingParentheticalText) && /^[-*+][ \t]+\S/.test(trimmed))
      const normalizedLine = shouldUnwrapListMarker ? line.replace(/^([ \t]*)[-*+][ \t]+/, '$1') : line
      const normalizedTrimmed = normalizedLine.trim()

      if (!normalizedTrimmed) {
        return normalizedLine
      }

      pendingParentheticalText = hasUnclosedParenthesis(pendingParentheticalText) ? `${pendingParentheticalText}${normalizedTrimmed}` : normalizedTrimmed
      if (!hasUnclosedParenthesis(pendingParentheticalText)) {
        pendingParentheticalText = ''
      }

      return normalizedLine
    })
    .join('\n')
}

const repairParentheticalListMarkers = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, repairParentheticalListMarkersSegment)
}

const normalizeStructuralMarkerLineBreakSegment = (raw: string): string => {
  return raw
    .replace(/⚠\s+️/g, '⚠️')
    .replace(inlineMarkdownListMarkerPattern, (match: string, previous: string, spacing: string, marker: string) => {
      if (!spacing && /[A-Za-z0-9]/.test(previous)) {
        return match
      }

      return `${previous}\n${marker} `
    })
    .replace(lineStartEmojiListMarkerPattern, '$1$2 ')
    .replace(inlineMarkdownOrderedListMarkerPattern, (match: string, previous: string, spacing: string, marker: string) => {
      if (!spacing && /[A-Za-z0-9]/.test(previous)) {
        return match
      }

      return `${previous}\n${marker}`
    })
    .replace(structuralEmojiMarkerPattern, (match: string, previous: string, spacing: string, marker: string, offset: number, content: string) => {
      const markerOffset = offset + previous.length + spacing.length
      const lineStart = content.lastIndexOf('\n', markerOffset - 1)
      const beforeMarker = content.slice(lineStart + 1, markerOffset)

      if (/^\s*[-*+]\s*$/.test(beforeMarker)) {
        return match
      }

      return `${previous}\n${marker}`
    })
}

const normalizeStructuralMarkerLineBreaks = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, normalizeStructuralMarkerLineBreakSegment)
}

const normalizeChatMarkdownLineBreakSegment = (raw: string): string => {
  return normalizeStructuralMarkerLineBreakSegment(repairParentheticalListMarkersSegment(normalizeSplitDomainTermsSegment(repairSplitStrongMarkersSegment(raw))))
}

const normalizeChatMarkdownLineBreaks = (content: string): string => {
  return normalizeOutsideFencedCodeBlocks(content, normalizeChatMarkdownLineBreakSegment)
}

const repairMarkdownListBreakSegment = (raw: string): string => {
  return raw
    .replace(/⚠\s+️/g, '⚠️')
    .replace(/(^|\n)([✅❌⚠️])\s*\n(?=\S)/g, '$1$2 ')
    .replace(/([^\s\n])([-*+]\s*[✅❌])/g, '$1\n$2')
    .replace(/([：:])\s*([-+]|\*(?!\*))\s*([✅❌•\w\u4e00-\u9fa5])/g, '$1\n$2 $3')
    .replace(/([。！？；.!?;])\s*([-+]|\*(?!\*))\s*([✅❌•\w\u4e00-\u9fa5])/g, '$1\n$2 $3')
    .replace(new RegExp(`(^|\\n)([-*+])(?=${structuralEmojiMarkerSource}|•)`, 'g'), '$1$2 ')
}

const repairMarkdownListBreaks = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, repairMarkdownListBreakSegment)
}

const standaloneSectionMarkerSource = '(?:✅|❌|⚠️?|📌|💡|🔍)'

const normalizeStandaloneSectionMarkersSegment = (raw: string): string => {
  return raw
    .replace(new RegExp(`(${standaloneSectionMarkerSource})[ \\t]*[-*+][ \\t]+`, 'g'), '$1 ')
    .replace(/([：:])\s*(✅|❌|⚠️?|📌|💡|🔍)[ \t]*(?:\n[ \t]*)+([^\s\n][^\n]{1,220})(?=\n|$)/g, '$1\n\n$2 $3\n')
    .replace(new RegExp(`([。！？；:：）)])\\s*(${standaloneSectionMarkerSource})[ \\t]*(?:\\n[ \\t]*)+([^\\s\\n][^\\n]{1,220})(?=\\n|$)`, 'g'), '$1\n\n$2 $3\n')
    .replace(new RegExp(`([。！？；:：）)])\\s*(${standaloneSectionMarkerSource})[ \\t]*(?=[\\u4e00-\\u9fa5A-Za-z])`, 'g'), '$1\n\n$2 ')
    .replace(new RegExp(`(^|\\n)([^\\n]*[。！？；:：）)]\\s*)\\n[ \\t]*(${standaloneSectionMarkerSource})[ \\t]*(?:\\n[ \\t]*)+([^\\s\\n][^\\n]{1,220})(?=\\n|$)`, 'g'), '$1$2\n\n$3 $4\n')
    .replace(new RegExp(`(^|\\n)[ \\t]*(${standaloneSectionMarkerSource})[ \\t]*(?:\\n[ \\t]*)+([^\\s\\n][^\\n]{1,220})(?=\\n|$)`, 'g'), '$1$2 $3\n')
    .replace(new RegExp(`(^|\\n)(${standaloneSectionMarkerSource}[^\\n]{1,100})\\n(?=[ \\t]*[-*+]\\s+)`, 'g'), '$1$2\n\n')
}

const normalizeStandaloneSectionMarkers = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, normalizeStandaloneSectionMarkersSegment)
}

const normalizeOrderedSectionMarkersSegment = (raw: string): string => {
  return raw
    .replace(/([：:。！？；）)])\s*(\d{1,2})\.[ \t]*(?:\n[ \t]*)+([^\s\n][^\n]{1,160})(?=\n|$)/g, '$1\n\n$2. $3\n')
    .replace(/([：:。！？；）)])\s*(\d{1,2})\.[ \t]+([^\n]{1,160})(?=\n|$)/g, '$1\n\n$2. $3')
    .replace(/(^|\n)(\d{1,2})\.[ \t]*(?:\n[ \t]*)+[-*+][ \t]*([^\s\n][^\n]{1,160})(?=\n|$)/g, '$1$2. $3\n')
}

const normalizeShortChineseTokenBreaksSegment = (raw: string): string => {
  return raw
    .replace(/(^|\n)([◆◇🔸▪▫•▸▶])[ \t]*(?:\n[ \t]*)+([^\s\n][^\n]{0,120})(?=\n|$)/g, '$1$2 $3')
    .replace(/(^|\n)([-*+][ \t]*)?([\u4e00-\u9fa5]{1,4})[ \t]*(?:\n[ \t]*)+([\u4e00-\u9fa5][^\n]{1,120})(?=\n|$)/g, (_match: string, prefix: string, listMarker: string = '', left: string, right: string) => {
      const merged = `${left}${right}`
      if (/^(?:如何|可以|例如|以及|并且|但是|而且)/.test(merged)) {
        return `${prefix}${listMarker}${merged}`
      }

      if (/^(?:如|例如|或|和|与|及|并|但|且|可)$/.test(left)) {
        return `${prefix}${listMarker}${left}\n${right}`
      }

      return `${prefix}${listMarker}${merged}`
    })
}

const normalizeStreamedMarkdownFragments = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, (content) => normalizeShortChineseTokenBreaksSegment(normalizeOrderedSectionMarkersSegment(content)))
}

const removeEmptyBlockquoteLines = (raw: string): string => {
  return raw.replace(/(^|\n)>[ \t]*(?=\n|$)/g, '$1')
}

const getImplicitFenceLanguage = (code: string): string => {
  if (looksLikeJavaCode(code)) {
    return 'java'
  }

  return ''
}

const repairStreamedCodeTokenBreaks = (code: string): string => {
  return code
    .replace(/<\s*\n\s*(\/?\s*(?:template|script|style)\b)/gi, '<$1')
    .replace(/(<\/?(?:template|script|style)\b[^>]*)\s+>/gi, '$1>')
    .replace(/<\/(template|script|style)(?!\s*>)(?=\s*<(?:\/?(?:template|script|style)\b))/gi, '</$1>\n')
}

const flushFence = (result: string[], language: string, codeLines: string[], closed: boolean) => {
  const code = repairStreamedCodeTokenBreaks(codeLines.join('\n'))
  if (!language && looksLikeFeatureTable(code)) {
    result.push(...code.split('\n'))
    return
  }

  const resolvedLanguage = language || getImplicitFenceLanguage(code)
  result.push(resolvedLanguage ? `\`\`\`${resolvedLanguage}` : '```')
  result.push(...code.split('\n'))

  if (closed) {
    result.push('```')
  }
}

const normalizeFencedCodeBlocks = (raw: string): string => {
  const lines = raw.split('\n')
  const result: string[] = []
  let inFence = false
  let fenceLanguage = ''
  let codeLines: string[] = []

  lines.forEach((line) => {
    if (!inFence) {
      const opening = line.match(/^```([^`]*)$/)
      if (opening) {
        inFence = true
        fenceLanguage = normalizeFenceLanguage(opening[1] ?? '')
        codeLines = []
        return
      }

      result.push(line)
      return
    }

    if (line.trim() === '```') {
      flushFence(result, fenceLanguage, codeLines, true)
      inFence = false
      fenceLanguage = ''
      codeLines = []
      return
    }

    codeLines.push(line)
  })

  if (inFence) {
    flushFence(result, fenceLanguage, codeLines, false)
  }

  return result.join('\n')
}

const looksLikeBareVueCode = (text: string): boolean => {
  const content = text.trim().replace(/^vue\s*(?=<)/i, '')

  if (!/^<(template|script|style)\b/i.test(content)) {
    return false
  }

  return /<script\s+setup\b[\s\S]*<\/script>/i.test(content) || /<template\b[\s\S]*<\/template>[\s\S]*<script\b[\s\S]*<\/script>/i.test(content)
}

const wrapBareVueCode = (raw: string): string => {
  if (/^```/m.test(raw) || !looksLikeBareVueCode(raw)) {
    return raw
  }

  const content = raw.trim().replace(/^vue\s*(?=<)/i, '')
  return `\`\`\`vue\n${content}\n\`\`\``
}

const shouldDecodeEscapedMarkdownStructure = (raw: string): boolean => {
  if (!/\\(?:r\\n|n|u003[ce]|u0026|t)/i.test(raw)) {
    return false
  }

  return /(?:\\r\\n|\\n){2,}/.test(raw) || /(?:\\r\\n|\\n)[ \t]*(?:#{1,6}\s|[-*+]\s+|\d{1,3}\.[ \t]+|>\s?|\||```)/.test(raw) || /\\u003[ce]/i.test(raw)
}

const decodeEscapedMarkdownStructure = (raw: string): string => {
  if (!shouldDecodeEscapedMarkdownStructure(raw)) {
    return raw
  }

  return raw
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\u0026/gi, '&')
}

const normalizeMarkdownContent = (raw: string): string => {
  const normalized = raw
    .replace(/\r\n?/g, '\n')
    .replace(/```([a-z][\w#+.-]*?)(?=(?:import|package|export|const|let|var|function|class|type|interface|public|private|protected|static|def|from|using|namespace|#include)\b|<(?:template|script|style|[a-z][\w-]*)(?:\s|>|$))/gi, '```$1\n')

  return normalizeOutsideFencedCodeBlocks(normalized, (content) => {
    return content
      .replace(/([：:])[ \t]*(?=1\.[ \t]*(?:\n|\S))/g, '$1\n\n')
      .replace(/(^|\n)(\d{1,2}\.)[ \t]*\n[ \t]*(?=\S)/g, '$1$2 ')
      .replace(/([\u4e00-\u9fa5])\n(?=[\u4e00-\u9fa5])/g, '$1')
      .replace(/[ \t]{2,}(?=\d{1,2}\.[ \t]+\S)/g, '\n')
  })
}

const normalizeMarkdownRenderContent = (raw: string): string => {
  const normalized = decodeEscapedMarkdownStructure(raw).replace(/\r\n?/g, '\n')

  return normalizeOutsideFencedCodeBlocks(normalized, (content) => {
    return content
      .replace(/(https?:\/\/[^\s\n[]+)(\[ERROR\])/g, '$1\n\n$2')
      .replace(/(\n\d{1,3}\.[^\n]+)\n(?:[ \t]*\n)+[ \t]*(?=\d{1,3}\.[ \t]+\S)/g, '$1\n')
  })
}

const normalizeMarkdownHeadingsSegment = (raw: string): string => {
  return raw
    .replace(/(^|\n)([ \t]{0,3}#{1,6})([^\s#])/g, '$1$2 $3')
    .replace(/(^|\n)([ \t]{0,3}#{1,6})[ \t]*$/g, '$1')
}

const normalizeMarkdownHeadings = (raw: string): string => {
  return normalizeOutsideFencedCodeBlocks(raw, normalizeMarkdownHeadingsSegment)
}

const closeUnfinishedFence = (raw: string): string => {
  const normalized = raw.replace(/```([a-z][\w#+.-]*?)(?=(?:import|package|export|const|let|var|function|class|type|interface|public|private|protected|static|def|from|using|namespace|#include)\b|<(?:template|script|style|[a-z][\w-]*)(?:\s|>|$))/gi, '```$1\n')
  const lines = normalized.split('\n')
  let inFence = false

  lines.forEach((line) => {
    if (/^```(?:[^`]*)?$/.test(line.trim())) {
      inFence = !inFence
    }
  })

  return inFence ? `${normalized}\n\`\`\`` : normalized
}

const normalizeFencedCodeForDisplay = (raw: string): string => {
  return raw.replace(/```([^\n`]*)\n([\s\S]*?)\n?```/g, (match: string, info: string, code: string) => {
    if (!code.trim()) {
      return ''
    }

    return `\`\`\`${info.trim()}\n${code}\n\`\`\``
  })
}

const isEmptyRenderedTableCell = (cell: string): boolean => {
  return !cell.replace(/<br\s*\/?\s*>|&nbsp;|\s/gi, '')
}

const getRenderedTableCellText = (cell: string): string => {
  return cell.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim()
}

const renderedHtmlToMarkdownText = (html: string): string => {
  return html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|li|tr|div|h[1-6])>/gi, '\n')
    .replace(/<\/(?:ul|ol|table|thead|tbody)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const repairRenderedFeatureTableHtml = (html: string, renderMarkdown?: (content: string) => string): string => {
  if (!/<th(?:\s[^>]*)?>\s*类别\s*<\/th>/.test(html) || !/<th(?:\s[^>]*)?>\s*补\s*充说明\s*<\/th>/.test(html)) {
    return html
  }

  const statusCellPattern = /^(?:✅|❌|⚠️|是|否|支持|不支持|部分支持|⚠️\s*部分支持)/
  const isStatusCell = (cell: string): boolean => statusCellPattern.test(getRenderedTableCellText(cell))
  const repairedHtml = html.replace(/<tbody>([\s\S]*?)<\/tbody>/g, (tbodyMatch: string, tbodyContent: string) => {
    const rowMatches = Array.from(tbodyContent.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/g))
    const rows = rowMatches.map((rowMatch) => Array.from(rowMatch[1].matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/g)).map((cellMatch) => cellMatch[1]))

    if (!rows.some((row) => row.length === 5 && isStatusCell(row[0]) && row[1] && row.slice(2).every(isEmptyRenderedTableCell))) {
      return tbodyMatch
    }

    const mergedRows: string[][] = []
    rows.forEach((row) => {
      const previous = mergedRows[mergedRows.length - 1]
      const isStatusContinuation = Boolean(row.length === 5 && previous?.length === 5 && isStatusCell(row[0]) && row[1] && row.slice(2).every(isEmptyRenderedTableCell))

      if (isStatusContinuation) {
        if (previous[3] && !isStatusCell(previous[3]) && isEmptyRenderedTableCell(previous[4])) {
          previous[2] = `${previous[2]}${previous[3]}`
          previous[3] = ''
        }

        if (isEmptyRenderedTableCell(previous[3]) && isEmptyRenderedTableCell(previous[4])) {
          previous[3] = row[0]
          previous[4] = row[1]
          return
        }
      }

      mergedRows.push([...row])
    })

    return `<tbody>${mergedRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`
  })

  const brokenFeatureTable = /<tbody>[\s\S]*?<td>\s*<\/td>[\s\S]*?<\/tbody>/.test(repairedHtml) && /<(?:ul|ol|li)\b/.test(repairedHtml) && repairedHtml.includes('|')
  if (brokenFeatureTable && renderMarkdown) {
    const fallbackMarkdown = repairFragmentedFeatureTable(renderedHtmlToMarkdownText(repairedHtml))
    if (fallbackMarkdown.includes('| 类别 | 功能模块 | 具体能力 | 是否支持PE | 补充说明 |')) {
      return renderMarkdown(fallbackMarkdown)
    }
  }

  return repairedHtml
}

const repairRenderedGenericStatusTables = (html: string): string => {
  const statusCellPattern = /^(?:✅|❌|⚠️|✓|✔|✗|✘|是|否|支持|不支持|部分支持|可访问|可查看|可编辑)/
  const isStatusCell = (cell: string): boolean => statusCellPattern.test(getRenderedTableCellText(cell))

  return html.replace(/<tbody>([\s\S]*?)<\/tbody>/g, (tbodyMatch: string, tbodyContent: string) => {
    const rowMatches = Array.from(tbodyContent.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/g))
    const rows = rowMatches.map((rowMatch) => Array.from(rowMatch[1].matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/g)).map((cellMatch) => cellMatch[1]))

    if (!rows.length) {
      return tbodyMatch
    }

    const mergedRows: string[][] = []
    rows.forEach((row) => {
      if (row.every(isEmptyRenderedTableCell)) {
        return
      }

      const previous = mergedRows[mergedRows.length - 1]
      const isStatusContinuation = Boolean(previous?.length === row.length && row.length >= 3 && isStatusCell(row[0]) && row[1] && row.slice(2).every(isEmptyRenderedTableCell))

      if (isStatusContinuation) {
        if (row.length === 3 && previous[1] && isEmptyRenderedTableCell(previous[2])) {
          previous[0] = `${previous[0]} ${previous[1]}`.trim()
          previous[1] = row[0]
          previous[2] = row[1]
          return
        }

        const statusIndex = row.length - 2
        const noteIndex = row.length - 1
        if (isEmptyRenderedTableCell(previous[statusIndex]) && isEmptyRenderedTableCell(previous[noteIndex])) {
          previous[statusIndex] = row[0]
          previous[noteIndex] = row[1]
          return
        }
      }

      mergedRows.push([...row])
    })

    return `<tbody>${mergedRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`
  })
}

const highlightCode = (code: string, language: string): string => {
  if (!code.trim()) {
    return ''
  }

  const normalizedLanguage = normalizeCodeLanguage(language)
  const languageClass = getCodeLanguageClass(normalizeCodeLanguageClass(language) || normalizedLanguage)
  const displayLanguage = getCodeLanguageClass(normalizeCodeLanguageClass(language) || normalizedLanguage || 'text') || 'text'
  const rawCode = escapeHtmlAttribute(code)

  if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
    const highlighted = hljs.highlight(code, { language: normalizedLanguage }).value
    return `<pre class="scq-chat-message__code-block"><div class="scq-chat-message__code-header"><span>${displayLanguage}</span><button type="button" class="scq-chat-message__code-copy" data-code="${rawCode}" aria-label="复制代码">复制</button></div><code class="hljs scq-chat-message__code-body language-${languageClass}">${highlighted}</code></pre>`
  }

  const highlighted = hljs.highlightAuto(code).value
  return `<pre class="scq-chat-message__code-block"><div class="scq-chat-message__code-header"><span>${displayLanguage}</span><button type="button" class="scq-chat-message__code-copy" data-code="${rawCode}" aria-label="复制代码">复制</button></div><code class="hljs scq-chat-message__code-body">${highlighted}</code></pre>`
}

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  highlight(code: string, language: string) {
    return highlightCode(code, language)
  },
})

markdown.renderer.rules.table_open = () => '<div class="scq-chat-message__table-wrap"><table>'
markdown.renderer.rules.table_close = () => '</table></div>'

export type ChatRole = 'ai' | 'user'
export type ChatMediaType = 'image' | 'video'
export type ChatContentType = 'auto' | 'text' | 'markdown' | 'json' | ChatMediaType
export type ChatStatusType = 'thinking' | 'tool' | 'loading' | 'success' | 'warning' | 'error'
export type ChatVideoPreload = 'auto' | 'metadata' | 'none'
export type ChatAttachmentType = 'pdf' | 'word' | 'excel' | 'ppt' | 'zip' | 'code' | 'text' | 'image' | 'video' | 'audio' | 'file'
export type ChatAttachmentStatus = 'default' | 'uploading' | 'success' | 'error'

export interface ChatMessageStatus {
  type?: ChatStatusType
  text?: string
  loading?: boolean
  visible?: boolean
}

export interface ChatMediaMessage {
  type?: ChatMediaType
  mediaType?: ChatMediaType
  contentType?: ChatMediaType
  src?: string
  url?: string
  source?: string
  alt?: string
  title?: string
  poster?: string
  controls?: boolean
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  preload?: ChatVideoPreload
}

export interface ChatAttachment {
  name: string
  url?: string
  type?: ChatAttachmentType | string
  size?: number | string
  download?: boolean | string
  target?: string
  rel?: string
  status?: ChatAttachmentStatus
  statusText?: string
  progress?: number
}

export interface ChatAttachmentClickPayload {
  attachment: ChatAttachment
  index: number
  name: string
  url: string
  type: ChatAttachmentType
  label: string
  sizeText: string
  status: ChatAttachmentStatus
  statusText: string
  progress: number | null
}

interface ResolvedMediaMessage {
  src: string
  alt: string
  title?: string
  poster?: string
  controls: boolean
  autoplay: boolean
  muted: boolean
  loop: boolean
  preload: ChatVideoPreload
}

interface NormalizedAttachment {
  key: string
  raw: ChatAttachment
  index: number
  name: string
  url: string
  type: ChatAttachmentType
  label: string
  icon: string
  sizeText: string
  download: boolean | string | undefined
  target: string | undefined
  rel: string | undefined
  status: ChatAttachmentStatus
  statusText: string
  progress: number | null
}

const props = withDefaults(
  defineProps<{
    message: unknown
    role?: ChatRole
    contentType?: ChatContentType
    markdownBreaks?: boolean
    showTime?: boolean
    status?: ChatMessageStatus | null
    avatar?: string
    avatarText?: string
    avatarAlt?: string
    name?: string
    showAvatar?: boolean
    showName?: boolean
    linkTarget?: string
    linkRel?: string
    previewable?: boolean
    imageFallbackText?: string
    attachments?: ChatAttachment[]
    attachmentClick?: (payload: ChatAttachmentClickPayload, event: MouseEvent) => boolean | void
    timestamp?: string | number | Date | null
    timeFormatter?: (value: string | number | Date | null | undefined) => string
  }>(),
  {
    role: 'ai',
    contentType: 'auto',
    markdownBreaks: true,
    showTime: true,
    status: null,
    avatar: '',
    avatarText: '',
    avatarAlt: '',
    name: '',
    showAvatar: true,
    showName: true,
    linkTarget: '_blank',
    linkRel: 'noopener noreferrer',
    previewable: true,
    imageFallbackText: '图片加载失败',
    attachments: () => [],
    attachmentClick: undefined,
    timestamp: null,
    timeFormatter: undefined,
  },
)

const emit = defineEmits<{
  (event: 'attachment-click', payload: ChatAttachmentClickPayload, nativeEvent: MouseEvent): void
  (event: 'preview-open', src: string): void
  (event: 'preview-close', src: string): void
  (event: 'image-error', src: string): void
}>()

const statusTextMap: Record<ChatStatusType, string> = {
  thinking: '',
  tool: '',
  loading: '',
  success: '',
  warning: '',
  error: '',
}

const attachmentLabelMap: Record<ChatAttachmentType, string> = {
  pdf: 'PDF',
  word: 'Word',
  excel: 'Excel',
  ppt: 'PPT',
  zip: 'ZIP',
  code: 'Code',
  text: 'Text',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  file: 'File',
}

const attachmentIconMap: Record<ChatAttachmentType, string> = {
  pdf: 'PDF',
  word: 'W',
  excel: 'X',
  ppt: 'P',
  zip: 'ZIP',
  code: '</>',
  text: 'TXT',
  image: 'IMG',
  video: 'VID',
  audio: 'AUD',
  file: 'FILE',
}

const showImagePreview = ref(false)
const imageLoadFailed = ref(false)
const previewRef = ref<HTMLElement | null>(null)

const defaultLinkOpen = markdown.renderer.rules.link_open ?? ((tokens, index, options, _env, self) => {
  return self.renderToken(tokens, index, options)
})

markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index]
  const markdownEnv = env && typeof env === 'object' && !Array.isArray(env) ? (env as Record<string, unknown>) : {}
  const linkTarget = typeof markdownEnv.linkTarget === 'string' ? markdownEnv.linkTarget.trim() : ''
  const linkRel = typeof markdownEnv.linkRel === 'string' ? markdownEnv.linkRel.trim() : ''

  if (linkTarget) {
    token.attrSet('target', linkTarget)
  }

  if (linkRel) {
    token.attrSet('rel', linkRel)
  }

  return defaultLinkOpen(tokens, index, options, env, self)
}

const maybeJsonString = (raw: string): boolean => {
  const text = raw.trim()
  if (!text) {
    return false
  }

  if (!((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']')))) {
    return false
  }

  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

const maybeMarkdown = (raw: string): boolean => {
  const markdownPattern = /(#{1,6}\s)|(^[ \t]{0,3}#{1,6}(?=[^\s#]))|(```)|(^>\s)|(^[-*+]\s)|(^\|.+\|\s*$)|(\[[^\]]+\]\([^\)]+\))|(\*\*[^*]+\*\*)/m
  return markdownPattern.test(raw)
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const normalizeMediaType = (value: unknown): ChatMediaType | null => {
  if (value === 'image' || value === 'video') {
    return value
  }

  return null
}

const detectMediaTypeBySource = (source: string): ChatMediaType | null => {
  const text = source.trim().split(/[?#]/)[0].toLowerCase()
  if (!text) {
    return null
  }

  if (/^data:image\//.test(text) || /\.(apng|avif|bmp|gif|jpe?g|png|svg|webp)$/.test(text)) {
    return 'image'
  }

  if (/^data:video\//.test(text) || /\.(mp4|ogg|ogv|mov|m4v|webm)$/.test(text)) {
    return 'video'
  }

  return null
}

const getMediaSource = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }

  if (!isRecord(value)) {
    return ''
  }

  const source = value.src ?? value.url ?? value.source
  return typeof source === 'string' ? source : ''
}

const getMessageMediaType = (value: unknown): ChatMediaType | null => {
  if (isRecord(value)) {
    const explicitType = normalizeMediaType(value.type) ?? normalizeMediaType(value.mediaType) ?? normalizeMediaType(value.contentType)
    if (explicitType) {
      return explicitType
    }
  }

  return detectMediaTypeBySource(getMediaSource(value))
}

const getAttachmentTypeByName = (name: string): ChatAttachmentType => {
  const extension = name.trim().split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''

  if (extension === 'pdf') return 'pdf'
  if (['doc', 'docx', 'dot', 'dotx', 'rtf'].includes(extension)) return 'word'
  if (['xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'csv'].includes(extension)) return 'excel'
  if (['ppt', 'pptx', 'pptm', 'pot', 'potx', 'pps', 'ppsx'].includes(extension)) return 'ppt'
  if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz'].includes(extension)) return 'zip'
  if (['js', 'ts', 'tsx', 'jsx', 'vue', 'json', 'html', 'css', 'scss', 'less', 'md', 'mdx', 'yaml', 'yml', 'xml', 'sql', 'py', 'java', 'go', 'rs', 'php', 'c', 'cpp', 'h', 'hpp', 'cs', 'sh', 'bat', 'ps1'].includes(extension)) return 'code'
  if (['txt', 'log', 'ini', 'conf'].includes(extension)) return 'text'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'apng', 'bmp', 'ico', 'heic'].includes(extension)) return 'image'
  if (['mp4', 'webm', 'mov', 'm4v', 'ogg', 'ogv', 'avi', 'mkv', 'flv', 'wmv'].includes(extension)) return 'video'
  if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'oga', 'wma'].includes(extension)) return 'audio'

  return 'file'
}

const normalizeAttachmentType = (type: unknown, name: string): ChatAttachmentType => {
  const value = typeof type === 'string' ? type.toLowerCase() : ''
  if (value in attachmentLabelMap) {
    return value as ChatAttachmentType
  }

  return getAttachmentTypeByName(name)
}

const formatAttachmentSize = (size: number | string | undefined): string => {
  if (typeof size === 'string') {
    return size
  }

  if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
    return ''
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = size
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

const clampProgress = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return Math.min(100, Math.max(0, value))
}

const resolvedContentType = computed<'text' | 'markdown' | 'json' | ChatMediaType>(() => {
  if (props.contentType !== 'auto') {
    return props.contentType
  }

  const mediaType = getMessageMediaType(props.message)
  if (mediaType) {
    return mediaType
  }

  if (typeof props.message !== 'string') {
    return 'json'
  }

  if (maybeJsonString(props.message)) {
    return 'json'
  }

  if (maybeMarkdown(props.message)) {
    return 'markdown'
  }

  return 'text'
})

const jsonText = computed(() => {
  if (typeof props.message === 'string') {
    const text = props.message.trim()
    if (maybeJsonString(text)) {
      try {
        return JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        return text
      }
    }
    return text
  }

  return JSON.stringify(props.message, null, 2)
})

const highlightedJson = computed(() => {
  const content = jsonText.value || '{}'
  return hljs.highlight(content, { language: 'json' }).value
})

const rawMarkdownContent = computed(() => {
  return normalizeMarkdownHeadings(normalizeMarkdownRenderContent(String(props.message ?? '')))
})

const renderedMarkdown = computed(() => {
  const markdownOptions = {
    linkTarget: props.linkTarget,
    linkRel: props.linkRel,
  }

  markdown.set({ breaks: props.markdownBreaks ?? true })
  return markdown.render(rawMarkdownContent.value, markdownOptions)
})

const renderedText = computed(() => {
  return String(props.message ?? '')
})

const hasMessageContent = computed(() => {
  const message = props.message

  if (message === null || message === undefined) {
    return false
  }

  if (typeof message === 'string') {
    return message.trim().length > 0
  }

  if (Array.isArray(message)) {
    return message.length > 0
  }

  if (isRecord(message)) {
    return Object.keys(message).length > 0
  }

  return true
})

const resolvedMedia = computed<ResolvedMediaMessage>(() => {
  const raw = props.message
  const source = getMediaSource(raw)
  const media: ChatMediaMessage = isRecord(raw) ? raw : {}

  return {
    src: source,
    alt: typeof media.alt === 'string' ? media.alt : '',
    title: typeof media.title === 'string' ? media.title : undefined,
    poster: typeof media.poster === 'string' ? media.poster : undefined,
    controls: media.controls !== false,
    autoplay: media.autoplay === true,
    muted: media.muted === true,
    loop: media.loop === true,
    preload: media.preload ?? 'metadata',
  }
})

const normalizedAttachments = computed<NormalizedAttachment[]>(() => {
  return props.attachments
    .filter((attachment) => attachment && attachment.name)
    .map((attachment, index) => {
      const name = attachment.name
      const type = normalizeAttachmentType(attachment.type, name)
      const status = attachment.status ?? 'default'
      const progress = clampProgress(attachment.progress)

      return {
        key: `${name}-${attachment.url ?? index}`,
        raw: attachment,
        index,
        name,
        url: attachment.url ?? '',
        type,
        label: attachmentLabelMap[type],
        icon: attachmentIconMap[type],
        sizeText: formatAttachmentSize(attachment.size),
        download: attachment.download,
        target: attachment.target ?? (attachment.url ? '_blank' : undefined),
        rel: attachment.rel ?? (attachment.url ? 'noopener noreferrer' : undefined),
        status,
        statusText: attachment.statusText ?? (status === 'uploading' ? '上传中' : status === 'error' ? '失败' : ''),
        progress,
      }
    })
})

const formatDateTime = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

const formattedTime = computed(() => {
  if (typeof props.timeFormatter === 'function') {
    return props.timeFormatter(props.timestamp)
  }

  if (props.timestamp === null || props.timestamp === undefined || props.timestamp === '') {
    return ''
  }

  return formatDateTime(props.timestamp)
})

const shouldShowTime = computed(() => {
  return props.showTime && Boolean(formattedTime.value)
})

const resolvedAvatarText = computed(() => {
  return props.avatarText.trim() || props.name.trim()
})

const shouldShowAvatar = computed(() => {
  return props.showAvatar && Boolean(props.avatar || resolvedAvatarText.value)
})

const shouldShowName = computed(() => {
  return props.showName && Boolean(props.name)
})

const avatarInitial = computed(() => {
  const text = resolvedAvatarText.value
  return text ? text.slice(0, 1).toUpperCase() : ''
})

const avatarAlt = computed(() => {
  const text = props.avatarAlt.trim()
  if (text) {
    return text
  }

  return resolvedAvatarText.value ? `${resolvedAvatarText.value} avatar` : 'avatar'
})

const avatarTitle = computed(() => {
  return resolvedAvatarText.value || undefined
})

const resolvedStatusType = computed<ChatStatusType>(() => {
  return props.status?.type ?? 'thinking'
})

const resolvedStatusLoading = computed(() => {
  return props.status?.loading ?? true
})

const resolvedStatusText = computed(() => {
  const text = props.status?.text?.trim() ?? ''
  return text || statusTextMap[resolvedStatusType.value]
})

const shouldShowStatus = computed(() => {
  if (hasMessageContent.value) {
    return false
  }

  if (typeof props.status?.visible === 'boolean') {
    return props.status.visible && Boolean(resolvedStatusText.value)
  }

  return Boolean(props.status && resolvedStatusText.value)
})

const shouldShowBubble = computed(() => {
  return hasMessageContent.value || !shouldShowStatus.value
})

const bubbleClasses = computed(() => {
  return `is-${resolvedContentType.value}`
})

const openImagePreview = () => {
  if (!props.previewable || !resolvedMedia.value.src || imageLoadFailed.value) {
    return
  }

  showImagePreview.value = true
  emit('preview-open', resolvedMedia.value.src)

  nextTick(() => {
    previewRef.value?.focus()
  })
}

const closeImagePreview = () => {
  if (!showImagePreview.value) {
    return
  }

  showImagePreview.value = false
  emit('preview-close', resolvedMedia.value.src)
}

const handleImageError = () => {
  imageLoadFailed.value = true
  showImagePreview.value = false
  emit('image-error', resolvedMedia.value.src)
}

const handleAttachmentClick = (event: MouseEvent, attachment: NormalizedAttachment) => {
  const payload: ChatAttachmentClickPayload = {
    attachment: attachment.raw,
    index: attachment.index,
    name: attachment.name,
    url: attachment.url,
    type: attachment.type,
    label: attachment.label,
    sizeText: attachment.sizeText,
    status: attachment.status,
    statusText: attachment.statusText,
    progress: attachment.progress,
  }
  const shouldContinue = props.attachmentClick?.(payload, event)

  emit('attachment-click', payload, event)

  if (shouldContinue === false || !attachment.url || attachment.status === 'uploading') {
    event.preventDefault()
  }
}

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

const handleCodeCopyClick = (event: MouseEvent) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('.scq-chat-message__code-copy') : null
  if (!target) {
    return
  }

  const text = target.dataset.code ?? ''
  if (!text) {
    return
  }

  copyText(text).then(() => {
    target.textContent = '已复制'
    window.setTimeout(() => {
      target.textContent = '复制'
    }, 1200)
  }).catch(() => {
    target.textContent = '复制失败'
    window.setTimeout(() => {
      target.textContent = '复制'
    }, 1200)
  })
}

onMounted(() => {
  document.addEventListener('click', handleCodeCopyClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleCodeCopyClick)
})

watch(
  () => resolvedMedia.value.src,
  () => {
    imageLoadFailed.value = false
    showImagePreview.value = false
  },
)
</script>

<style scoped>
.scq-chat-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0;
}

.scq-chat-message__body {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 100%;
}

.scq-chat-message__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  max-width: min(80%, 680px);
}

.scq-chat-message__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background: linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%);
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.12);
}

.scq-chat-message__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scq-chat-message__name {
  max-width: 100%;
  margin: 0 4px 5px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scq-chat-message__time {
  font-size: 12px;
  color: #8c93a3;
  line-height: 1;
}

.scq-chat-message__bubble {
  max-width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  white-space: normal;
}

.scq-chat-message.is-ai {
  align-items: flex-start;
}

.scq-chat-message.is-user {
  align-items: flex-end;
}

.scq-chat-message.is-user .scq-chat-message__body {
  flex-direction: row-reverse;
}

.scq-chat-message.is-user .scq-chat-message__content {
  align-items: flex-end;
}

.scq-chat-message.is-user .scq-chat-message__avatar {
  border-color: rgba(43, 110, 242, 0.22);
  background: linear-gradient(135deg, #2b6ef2 0%, #22c4e8 100%);
  color: #ffffff;
}

.scq-chat-message.is-user .scq-chat-message__name {
  color: #7b8798;
}

.scq-chat-message.is-ai .scq-chat-message__time {
  margin-left: 4px;
  color: #5d6d8a;
}

.scq-chat-message.is-user .scq-chat-message__time {
  margin-right: 4px;
}

.scq-chat-message.is-ai .scq-chat-message__bubble {
  background: #f8fbff;
  color: #12355b;
  border: 1px solid #8fbaf5;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
}

.scq-chat-message.is-user .scq-chat-message__bubble {
  background: #2b6ef2;
  color: #ffffff;
  border: 1px solid #2b6ef2;
  border-bottom-right-radius: 4px;
}

.scq-chat-message__text {
  margin: 0;
  white-space: pre-wrap;
}

.scq-chat-message__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  max-width: none;
  margin: 0 4px;
  padding: 5px 9px 5px 7px;
  border-radius: 999px;
  border: 1px solid rgba(96, 165, 250, 0.28);
  background: rgba(219, 234, 254, 0.62);
  color: #1d4ed8;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  vertical-align: top;
}

.scq-chat-message__status-text {
  min-width: 0;
  flex: 0 0 auto;
  overflow-wrap: anywhere;
}

.scq-chat-message__status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
}

.scq-chat-message__status-indicator span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.34;
  animation: scq-chat-message-status 1.2s ease-in-out infinite;
}

.scq-chat-message__status-indicator span:nth-child(2) {
  animation-delay: 0.16s;
}

.scq-chat-message__status-indicator span:nth-child(3) {
  animation-delay: 0.32s;
}

.scq-chat-message__status.is-tool {
  border-color: rgba(20, 184, 166, 0.28);
  background: rgba(204, 251, 241, 0.64);
  color: #0f766e;
}

.scq-chat-message__status.is-loading {
  border-color: rgba(99, 102, 241, 0.26);
  background: rgba(224, 231, 255, 0.66);
  color: #4338ca;
}

.scq-chat-message__status.is-success {
  border-color: rgba(34, 197, 94, 0.28);
  background: rgba(220, 252, 231, 0.68);
  color: #15803d;
}

.scq-chat-message__status.is-warning {
  border-color: rgba(245, 158, 11, 0.32);
  background: rgba(254, 243, 199, 0.72);
  color: #a16207;
}

.scq-chat-message__status.is-error {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(254, 226, 226, 0.74);
  color: #b91c1c;
}

@keyframes scq-chat-message-status {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.34;
  }

  40% {
    transform: translateY(-2px);
    opacity: 1;
  }
}

.scq-chat-message__bubble.is-image,
.scq-chat-message__bubble.is-video {
  width: fit-content;
  max-width: min(100%, 520px);
  padding: 6px;
  line-height: 0;
  white-space: normal;
}

.scq-chat-message__media {
  display: block;
  line-height: 0;
}

.scq-chat-message__image,
.scq-chat-message__video {
  display: block;
  width: 100%;
  max-width: 100%;
  max-height: 360px;
  border-radius: 10px;
  object-fit: contain;
  background: #0f172a;
}

.scq-chat-message__image {
  height: auto;
}

.scq-chat-message__image[role='button'] {
  cursor: zoom-in;
}

.scq-chat-message__image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(280px, 70vw);
  min-height: 112px;
  border-radius: 10px;
  border: 1px dashed rgba(148, 163, 184, 0.65);
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
}

.scq-chat-message__video {
  min-width: 220px;
}

.scq-chat-message__actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
  padding: 0 4px;
}

.scq-chat-message__action {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #475569;
  font-size: 12px;
  line-height: 1;
  padding: 5px 9px;
  cursor: pointer;
}

.scq-chat-message__action:hover {
  border-color: rgba(59, 130, 246, 0.35);
  color: #2563eb;
  background: #eff6ff;
}

.scq-chat-message__preview {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  outline: none;
  background: rgba(15, 23, 42, 0.78);
}

.scq-chat-message__preview img {
  display: block;
  max-width: min(100%, 1080px);
  max-height: 88vh;
  border-radius: 10px;
  object-fit: contain;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.scq-chat-message__preview-close {
  position: absolute;
  top: 18px;
  right: 22px;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.scq-chat-message__preview-close:hover {
  background: rgba(255, 255, 255, 0.22);
}

.scq-chat-message__attachments {
  display: grid;
  gap: 8px;
  width: min(100%, 440px);
  margin-top: 8px;
}

.scq-chat-message__attachment {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 58px;
  padding: 9px 11px;
  border: 1px solid #dbe7f5;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f2937;
  text-decoration: none;
  white-space: normal;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.scq-chat-message__attachment[href]:hover {
  border-color: rgba(59, 130, 246, 0.42);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.12);
  transform: translateY(-1px);
}

.scq-chat-message__attachment[aria-disabled='true'],
.scq-chat-message__attachment.is-uploading {
  cursor: default;
}

.scq-chat-message__attachment-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #eaf3ff;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
}

.scq-chat-message__attachment.is-pdf .scq-chat-message__attachment-icon,
.scq-chat-message__attachment.is-error .scq-chat-message__attachment-icon {
  background: #fee2e2;
  color: #b91c1c;
}

.scq-chat-message__attachment.is-word .scq-chat-message__attachment-icon {
  background: #dbeafe;
  color: #1d4ed8;
}

.scq-chat-message__attachment.is-excel .scq-chat-message__attachment-icon {
  background: #dcfce7;
  color: #15803d;
}

.scq-chat-message__attachment.is-ppt .scq-chat-message__attachment-icon,
.scq-chat-message__attachment.is-zip .scq-chat-message__attachment-icon {
  background: #ffedd5;
  color: #c2410c;
}

.scq-chat-message__attachment.is-code .scq-chat-message__attachment-icon,
.scq-chat-message__attachment.is-text .scq-chat-message__attachment-icon {
  background: #ede9fe;
  color: #6d28d9;
}

.scq-chat-message__attachment-main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.scq-chat-message__attachment-name {
  overflow: hidden;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scq-chat-message__attachment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.2;
}

.scq-chat-message__attachment-progress {
  overflow: hidden;
  height: 4px;
  border-radius: 999px;
  background: #e2e8f0;
}

.scq-chat-message__attachment-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #3b82f6;
}

.scq-chat-message.is-user .scq-chat-message__attachment {
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.scq-chat-message.is-user .scq-chat-message__attachment-name,
.scq-chat-message.is-user .scq-chat-message__attachment-meta {
  color: rgba(255, 255, 255, 0.92);
}

.scq-chat-message__markdown {
  display: flow-root;
  white-space: normal;
}

.scq-chat-message__markdown :deep(h1),
.scq-chat-message__markdown :deep(h2),
.scq-chat-message__markdown :deep(h3),
.scq-chat-message__markdown :deep(h4),
.scq-chat-message__markdown :deep(h5),
.scq-chat-message__markdown :deep(h6) {
  margin: 12px 0 8px;
  color: inherit;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}

.scq-chat-message__markdown :deep(p) {
  margin: 0 0 10px;
}

.scq-chat-message__markdown :deep(ul),
.scq-chat-message__markdown :deep(ol) {
  margin: 8px 0 10px;
}

.scq-chat-message__markdown :deep(ul) {
  list-style: none;
  padding-left: 0;
}

.scq-chat-message__markdown :deep(ol) {
  padding-left: 22px;
}

.scq-chat-message__markdown :deep(li) {
  margin: 4px 0;
}

.scq-chat-message__markdown :deep(ul > li) {
  position: relative;
  padding-left: 1.05em;
}

.scq-chat-message__markdown :deep(ul > li::before) {
  content: '-';
  position: absolute;
  left: 0;
}

.scq-chat-message__markdown :deep(ol > li) {
  padding-left: 2px;
}

.scq-chat-message__markdown :deep(li > p),
.scq-chat-message__markdown :deep(li > h1),
.scq-chat-message__markdown :deep(li > h2),
.scq-chat-message__markdown :deep(li > h3),
.scq-chat-message__markdown :deep(li > h4),
.scq-chat-message__markdown :deep(li > h5),
.scq-chat-message__markdown :deep(li > h6) {
  margin: 4px 0;
}

.scq-chat-message__markdown :deep(li > p) {
  margin: 0;
}

.scq-chat-message__markdown :deep(li > p + p) {
  margin-top: 4px;
}

.scq-chat-message__markdown :deep(blockquote) {
  margin: 10px 0;
  padding: 8px 12px;
  border-left: 3px solid #bfdbfe;
  background: rgba(219, 234, 254, 0.34);
  color: #334155;
}

.scq-chat-message__markdown :deep(:first-child) {
  margin-top: 0;
}

.scq-chat-message__markdown :deep(:last-child) {
  margin-bottom: 0;
}

.scq-chat-message__table-wrap {
  position: relative;
  width: 100%;
  overflow-x: auto;
  margin: 10px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(60, 60, 67, 0.42) transparent;
}

.scq-chat-message__table-wrap::before,
.scq-chat-message__table-wrap::after {
  content: '';
  position: sticky;
  top: 0;
  bottom: 0;
  width: 18px;
  pointer-events: none;
  z-index: 1;
}

.scq-chat-message__table-wrap::before {
  left: 0;
  float: left;
  margin-right: -18px;
  background: linear-gradient(90deg, rgba(248, 251, 255, 0.95) 0%, rgba(248, 251, 255, 0) 100%);
}

.scq-chat-message__table-wrap::after {
  right: 0;
  float: right;
  margin-left: -18px;
  background: linear-gradient(270deg, rgba(248, 251, 255, 0.95) 0%, rgba(248, 251, 255, 0) 100%);
}

.scq-chat-message__table-wrap::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scq-chat-message__table-wrap::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid transparent;
  background: rgba(60, 60, 67, 0.38);
  background-clip: content-box;
}

.scq-chat-message__table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.scq-chat-message__markdown :deep(table) {
  width: max-content;
  min-width: 100%;
  table-layout: auto;
  border-collapse: collapse;
  margin: 0;
  background: #ffffff;
}

.scq-chat-message__markdown :deep(th),
.scq-chat-message__markdown :deep(td) {
  min-width: 120px;
  max-width: 320px;
  padding: 10px 14px;
  border: 1px solid #dbe4ee;
  text-align: left;
  vertical-align: top;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.scq-chat-message__markdown :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
  color: #334155;
}

.scq-chat-message__markdown :deep(td) {
  color: #334155;
}

.scq-chat-message__markdown :deep(tbody tr:nth-child(even)) {
  background: #f8fafc;
}

.scq-chat-message__markdown :deep(code:not(.hljs)) {
  font-family: 'Consolas', 'SFMono-Regular', Menlo, Monaco, monospace;
  font-size: 13px;
  border-radius: 6px;
  padding: 2px 6px;
  background: rgba(17, 24, 39, 0.08);
}

.scq-chat-message.is-ai .scq-chat-message__markdown :deep(code:not(.hljs)) {
  background: #eaf3ff;
}

.scq-chat-message__code-block {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin: 10px 0;
  border-radius: 8px;
  overflow: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(60, 60, 67, 0.42) transparent;
  background: #282c34;
  color: #abb2bf;
}

.scq-chat-message__code-header {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0;
  color: #a7adba;
  font-size: 12px;
  line-height: 1;
}

.scq-chat-message__code-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 0;
  border-radius: 6px;
  min-width: 32px;
  height: 24px;
  padding: 0 8px;
  background: #eef0f3;
  color: #4b5563;
  font: inherit;
  cursor: pointer;
}

.scq-chat-message__code-copy:hover {
  background: #ffffff;
  color: #111827;
}

.scq-chat-message__code-block::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scq-chat-message__code-block::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 2px solid transparent;
  background: rgba(226, 232, 240, 0.45);
  background-clip: content-box;
}

.scq-chat-message__code-block::-webkit-scrollbar-track {
  background: transparent;
}

@media (hover: hover) {
  .scq-chat-message__table-wrap::-webkit-scrollbar-thumb {
    background: rgba(60, 60, 67, 0.52);
    background-clip: content-box;
  }

  .scq-chat-message__code-block::-webkit-scrollbar-thumb {
    background: rgba(226, 232, 240, 0.62);
    background-clip: content-box;
  }
}

.scq-chat-message__code-block code,
.scq-chat-message__markdown :deep(.scq-chat-message__code-block code) {
  display: block;
  min-width: max-content;
  max-height: 520px;
  padding: 20px 24px;
  overflow: auto;
  font-family: 'Source Code Pro', Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre;
  background: #282c34;
  color: #abb2bf;
}

.scq-chat-message__code-block .scq-chat-message__code-body,
.scq-chat-message__markdown :deep(.scq-chat-message__code-block .scq-chat-message__code-body) {
  padding-top: 42px;
}

.scq-chat-message.is-user .scq-chat-message__markdown :deep(a) {
  color: #dbe8ff;
}

.scq-chat-message.is-ai .scq-chat-message__markdown :deep(a) {
  color: #2454c6;
}

.scq-chat-message :deep(.hljs-keyword),
.scq-chat-message :deep(.hljs-string),
.scq-chat-message :deep(.hljs-number),
.scq-chat-message :deep(.hljs-title),
.scq-chat-message :deep(.hljs-attr),
.scq-chat-message :deep(.hljs-literal) {
  color: inherit;
}

.scq-chat-message.is-ai :deep(.hljs-keyword),
.scq-chat-message.is-ai :deep(.hljs-attr) {
  color: #7c3aed;
}

.scq-chat-message.is-ai :deep(.hljs-string) {
  color: #0f766e;
}

.scq-chat-message.is-ai :deep(.hljs-number),
.scq-chat-message.is-ai :deep(.hljs-literal) {
  color: #c2410c;
}

.scq-chat-message.is-user :deep(.hljs-keyword),
.scq-chat-message.is-user :deep(.hljs-attr) {
  color: #c4b5fd;
}

.scq-chat-message.is-user :deep(.hljs-string) {
  color: #5eead4;
}

.scq-chat-message.is-user :deep(.hljs-number),
.scq-chat-message.is-user :deep(.hljs-literal) {
  color: #fdba74;
}
</style>
