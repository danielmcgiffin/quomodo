<script lang="ts">
  import { onMount } from "svelte"
  import { Editor } from "@tiptap/core"
  import { generateJSON } from "@tiptap/html"
  import { createRichTextExtensions } from "$lib/rich-text/extensions"
  import {
    parseRichTextDocumentString,
    plainTextToRichTextDocument,
  } from "$lib/rich-text/document"

  let {
    richValue = $bindable(""),
    textValue = $bindable(""),
    fieldName = "description_rich",
    textFieldName = "description",
    htmlValue = "",
    required = false,
  }: {
    richValue?: string
    textValue?: string
    fieldName?: string
    textFieldName?: string
    htmlValue?: string
    required?: boolean
  } = $props()

  let editorElement: HTMLDivElement | null = null
  let editor = $state<Editor | null>(null)
  let syncingFromEditor = false

  const parseContent = () => {
    const parsed = parseRichTextDocumentString(richValue)
    if (parsed) {
      return parsed
    }

    const html = htmlValue.trim()
    if (html) {
      try {
        return generateJSON(html, createRichTextExtensions())
      } catch {
        return plainTextToRichTextDocument(textValue)
      }
    }

    return plainTextToRichTextDocument(textValue)
  }

  const syncHiddenValues = () => {
    if (!editor) {
      return
    }
    syncingFromEditor = true
    richValue = JSON.stringify(editor.getJSON())
    textValue = editor.getText().trim()
    syncingFromEditor = false
  }

  const markState = (markName: string) => Boolean(editor?.isActive(markName))
  const nodeState = (nodeName: string) => Boolean(editor?.isActive(nodeName))

  onMount(() => {
    if (!editorElement) {
      return
    }

    editor = new Editor({
      element: editorElement,
      extensions: createRichTextExtensions(),
      content: parseContent(),
      editorProps: {
        attributes: {
          class: "sc-rich-editor-content",
        },
      },
      onUpdate: () => {
        syncHiddenValues()
      },
    })

    syncHiddenValues()

    return () => {
      editor?.destroy()
      editor = null
    }
  })

  $effect(() => {
    if (!editor || syncingFromEditor) {
      return
    }

    const current = JSON.stringify(editor.getJSON())
    const nextContent = parseContent()
    const next = JSON.stringify(nextContent)
    if (current === next) {
      return
    }

    editor.commands.setContent(nextContent, { emitUpdate: false })
    syncHiddenValues()
  })
</script>

<div class="sc-rich-editor">
  <div class="sc-rich-editor-toolbar">
    <button
      type="button"
      class="sc-rich-editor-btn"
      class:is-active={markState("bold")}
      onclick={() => editor?.chain().focus().toggleBold().run()}
      aria-label="Toggle bold"
    >
      Bold
    </button>
    <button
      type="button"
      class="sc-rich-editor-btn"
      class:is-active={markState("italic")}
      onclick={() => editor?.chain().focus().toggleItalic().run()}
      aria-label="Toggle italic"
    >
      Italic
    </button>
    <button
      type="button"
      class="sc-rich-editor-btn"
      class:is-active={nodeState("bulletList")}
      onclick={() => editor?.chain().focus().toggleBulletList().run()}
      aria-label="Toggle bullet list"
    >
      Bullets
    </button>
    <button
      type="button"
      class="sc-rich-editor-btn"
      class:is-active={nodeState("orderedList")}
      onclick={() => editor?.chain().focus().toggleOrderedList().run()}
      aria-label="Toggle ordered list"
    >
      Numbers
    </button>
    <button
      type="button"
      class="sc-rich-editor-btn"
      onclick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
      aria-label="Clear formatting"
    >
      Clear
    </button>
  </div>

  <div class="sc-rich-editor-shell">
    <div bind:this={editorElement}></div>
  </div>

  <input type="hidden" name={fieldName} value={richValue} />
  <input type="hidden" name={textFieldName} value={textValue} />

  {#if required}
    <input
      type="text"
      class="sc-rich-editor-required"
      value={textValue}
      required
      tabindex="-1"
      aria-hidden="true"
      onfocus={(event) => {
        event.preventDefault()
        editor?.commands.focus("end")
      }}
      oninput={() => undefined}
    />
  {/if}
</div>
