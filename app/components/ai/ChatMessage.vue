<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}>()

marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedContent = computed(() => {
  if (props.role === 'user') return props.content
  if (!props.content) return ''
  let html = marked.parse(props.content, { async: false }) as string
  html = html.replace(
    /<table>/g,
    '<div class="ai-table-wrap"><table>',
  ).replace(/<\/table>/g, '</table></div>')
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'hr', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'align'],
  })
})
</script>

<template>
  <div
    class="flex w-full"
    :class="role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[85%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
      :class="role === 'user'
        ? 'whitespace-pre-wrap bg-gradient-to-br from-brand-500 to-brand-600 text-white'
        : 'border border-slate-200/80 bg-white/90 text-ink-800 dark:!border-white/10 dark:!text-slate-100'"
    >
      <template v-if="role === 'user'">
        <template v-if="content">{{ content }}</template>
      </template>
      <template v-else>
        <div v-if="content" class="ai-markdown" v-html="renderedContent" />
        <span v-else-if="streaming" class="inline-flex items-center gap-1.5 py-0.5">
          <span class="ai-bounce-dot" />
          <span class="ai-bounce-dot" style="animation-delay: 150ms" />
          <span class="ai-bounce-dot" style="animation-delay: 300ms" />
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ai-bounce-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background-color: rgb(116 109 96);
  animation: ai-bounce-up 0.9s infinite cubic-bezier(0.42, 0, 0.58, 1);
}
@keyframes ai-bounce-up {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
}
.ai-markdown :deep(p) {
  margin: 0;
}
.ai-markdown :deep(p + p) {
  margin-top: 0.5rem;
}
.ai-markdown :deep(strong) {
  font-weight: 600;
  color: rgb(67 63 57);
}
.ai-markdown :deep(em) {
  font-style: italic;
}
.ai-markdown :deep(ul),
.ai-markdown :deep(ol) {
  margin: 0.4rem 0 0.4rem 1.1rem;
  padding: 0;
}
.ai-markdown :deep(ul) {
  list-style: disc;
}
.ai-markdown :deep(ol) {
  list-style: decimal;
}
.ai-markdown :deep(li) {
  margin: 0.15rem 0;
}
.ai-markdown :deep(li > p) {
  margin: 0;
}
.ai-markdown :deep(h1),
.ai-markdown :deep(h2),
.ai-markdown :deep(h3),
.ai-markdown :deep(h4) {
  font-weight: 700;
  margin: 0.5rem 0 0.25rem;
  color: rgb(67 63 57);
}
.ai-markdown :deep(h1) {
  font-size: 1.05rem;
}
.ai-markdown :deep(h2) {
  font-size: 1rem;
}
.ai-markdown :deep(h3),
.ai-markdown :deep(h4) {
  font-size: 0.9rem;
}
.ai-markdown :deep(code) {
  background: rgba(15, 23, 42, 0.06);
  padding: 0.1rem 0.35rem;
  border-radius: 0.375rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
}
.ai-markdown :deep(pre) {
  background: rgba(15, 23, 42, 0.85);
  color: rgb(241 245 249);
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  font-size: 0.78rem;
  line-height: 1.45;
}
.ai-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}
.ai-markdown :deep(blockquote) {
  border-left: 3px solid rgb(255 138 67 / 0.5);
  padding: 0.1rem 0 0.1rem 0.6rem;
  margin: 0.4rem 0;
  color: rgb(116 109 96);
}
.ai-markdown :deep(a) {
  color: rgb(243 95 16);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.ai-markdown :deep(hr) {
  border: 0;
  border-top: 1px solid rgb(226 232 240);
  margin: 0.6rem 0;
}
.ai-markdown :deep(.ai-table-wrap) {
  position: relative;
  margin: 0.5rem 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  border-radius: 0.5rem;
  border: 1px solid rgb(226 232 240);
  scrollbar-width: thin;
}
.ai-markdown :deep(.ai-table-wrap)::-webkit-scrollbar {
  height: 6px;
}
.ai-markdown :deep(.ai-table-wrap)::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.4);
  border-radius: 9999px;
}
.ai-markdown :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 0.78rem;
  border: 0;
}
.ai-markdown :deep(thead) {
  background: rgba(255, 138, 67, 0.08);
}
.ai-markdown :deep(th),
.ai-markdown :deep(td) {
  padding: 0.4rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid rgb(226 232 240);
  border-right: 1px solid rgb(226 232 240);
  white-space: nowrap;
}
.ai-markdown :deep(th:last-child),
.ai-markdown :deep(td:last-child) {
  border-right: 0;
}
.ai-markdown :deep(tr:last-child td) {
  border-bottom: 0;
}
.ai-markdown :deep(th) {
  font-weight: 600;
  color: rgb(67 63 57);
  white-space: nowrap;
}
.ai-markdown :deep(tbody tr:nth-child(even)) {
  background: rgba(15, 23, 42, 0.02);
}
</style>

<style>
.dark .ai-markdown strong,
.dark .ai-markdown b,
.dark .ai-markdown h1,
.dark .ai-markdown h2,
.dark .ai-markdown h3,
.dark .ai-markdown h4 {
  color: rgb(246 241 235);
}
.ai-markdown .ai-table-wrap strong,
.ai-markdown .ai-table-wrap b,
.ai-markdown .ai-table-wrap h1,
.ai-markdown .ai-table-wrap h2,
.ai-markdown .ai-table-wrap h3,
.ai-markdown .ai-table-wrap h4 {
  color: rgb(67 63 57) !important;
}
.dark .ai-markdown blockquote {
  color: rgb(218 217 212);
}
.dark .ai-markdown hr {
  border-top-color: rgba(255, 255, 255, 0.1);
}
.dark .ai-markdown code {
  background: rgba(255, 255, 255, 0.08);
  color: rgb(241 245 249);
}

.ai-markdown .ai-table-wrap {
  background-color: rgb(255 255 255) !important;
}
.ai-markdown .ai-table-wrap table,
.ai-markdown .ai-table-wrap thead,
.ai-markdown .ai-table-wrap tbody,
.ai-markdown .ai-table-wrap tr {
  background-color: transparent !important;
}
.ai-markdown .ai-table-wrap thead {
  background-color: rgba(255, 138, 67, 0.1) !important;
}
.ai-markdown .ai-table-wrap tbody tr:nth-child(even) {
  background-color: rgba(15, 23, 42, 0.03) !important;
}
.ai-markdown .ai-table-wrap th,
.ai-markdown .ai-table-wrap td {
  background-color: transparent !important;
  color: rgb(67 63 57) !important;
  border-bottom: 1px solid rgb(226 232 240) !important;
  border-right: 1px solid rgb(226 232 240) !important;
}
.ai-markdown .ai-table-wrap th:last-child,
.ai-markdown .ai-table-wrap td:last-child {
  border-right: 0 !important;
}
.ai-markdown .ai-table-wrap tr:last-child td {
  border-bottom: 0 !important;
}
.ai-markdown .ai-table-wrap th {
  color: rgb(67 63 57) !important;
  font-weight: 600;
}
</style>
