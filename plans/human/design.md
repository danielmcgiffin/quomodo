Here's everything organized by category:

  ---
  Design Tokens (:root variables)

  Colors: --sc-green, --sc-green-dark, --sc-green-light,
  --sc-green-border, --sc-green-shadow, --sc-bg, --sc-white,
  --sc-bg-inset, --sc-border, --sc-border-light, --sc-text,
  --sc-text-muted, --sc-text-light, --sc-flag,
  --sc-flag-border, --sc-flag-text, --sc-flag-banner,
  --sc-success, --sc-danger

  Radii: --sc-radius-sm (6px), --sc-radius-md (8px),
  --sc-radius-lg (12px), --sc-radius-xl (14px),
  --sc-radius-full (9999px)

  Typography: --sc-font-xs through --sc-font-2xl

  Shadows: --sc-shadow-card

  ---
  Primitives (CSS-only, no Svelte file)
  ┌─────────┬───────────────────────────┬───────────────────┐
  │ Element │          Classes          │       Notes       │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Button  │ .sc-btn,                  │ Primary + outline │
  │         │ .sc-btn.secondary         │  variant          │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Icon    │ .sc-icon-btn              │ Small bordered    │
  │ Button  │                           │ icon action       │
  ├─────────┼───────────────────────────┼───────────────────┤
  │         │ .sc-card,                 │ Base card +       │
  │ Card    │ .sc-entity-card,          │ entity hover +    │
  │         │ .sc-card-interactive,     │ clickable + flag  │
  │         │ .sc-card-flag             │ yellow variants   │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Pill    │ .sc-pill                  │ Inline badge/tag  │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Avatar  │ .sc-avatar,               │ Circular initials │
  │         │ .sc-avatar-nav            │  badge, two sizes │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ System  │ .sc-system                │ Rounded-square    │
  │ Icon    │                           │ with hex SVG      │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Section │ .sc-section,              │ Heading + spacing │
  │         │ .sc-section-title         │  block            │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Banner  │ .sc-banner,               │ Top-of-page alert │
  │         │ .sc-banner--warning       │  strip            │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Toast   │ .sc-toast,                │ Floating          │
  │         │ .sc-toast-modal-below     │ notification      │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Flag    │ .sc-flag-banner           │ Inline flag-type  │
  │ Banner  │                           │ label pill        │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Meta    │ .sc-meta                  │ Uppercase tiny    │
  │ Label   │                           │ label             │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Byline  │ .sc-byline                │ Inline row of     │
  │         │                           │ portals/text      │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Muted   │ .sc-muted-line            │ Secondary text    │
  │ Line    │                           │                   │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Search  │                           │ Dropdown filter + │
  │ Input   │ .sc-search, .sc-searchbar │  global search    │
  │         │                           │ bar               │
  ├─────────┼───────────────────────────┼───────────────────┤
  │         │ .sc-form, .sc-form-row,   │                   │
  │ Form    │ .sc-field, .sc-textarea,  │ Form layout       │
  │         │ .sc-form-actions,         │ system            │
  │         │ .sc-form-error            │                   │
  ├─────────┼───────────────────────────┼───────────────────┤
  │ Rich    │ .sc-rich, .sc-copy-md     │ Rendered HTML     │
  │ Text    │                           │ prose styling     │
  └─────────┴───────────────────────────┴───────────────────┘
  ---
  Portals (entity link atoms)
  Component: RolePortal.svelte
  Classes: .sc-portal, .sc-portal-role — avatar + name link
  ────────────────────────────────────────
  Component: ProcessPortal.svelte
  Classes: .sc-portal, .sc-portal-process — name link (hover
    green)
  ────────────────────────────────────────
  Component: SystemPortal.svelte
  Classes: .sc-portal, .sc-portal-system — system icon + name

    link
  ---
  Layout Shell
  Component / Classes: ScShell.svelte
  What it is: App shell wrapper
  ────────────────────────────────────────
  Component / Classes: .sc-shell
  What it is: 264px sidebar + main grid
  ────────────────────────────────────────
  Component / Classes: .sc-sidebar, .sc-sidebar-inner,
    .sc-sidebar-nav, .sc-sidebar-footer
  What it is: Sidebar navigation
  ────────────────────────────────────────
  Component / Classes: .sc-side-link, .sc-side-label,
    .sc-side-count
  What it is: Sidebar nav item + badge
  ────────────────────────────────────────
  Component / Classes: .sc-sidebar-brand,
    .sc-sidebar-brand-pill
  What it is: Logo lockup
  ────────────────────────────────────────
  Component / Classes: .sc-topbar, .sc-topbar-inner,
    .sc-topbar-search, .sc-topbar-actions
  What it is: Top bar
  ────────────────────────────────────────
  Component / Classes: .sc-mobile-header, .sc-hamburger,
    .sc-sidebar-overlay,
    .sc-floating-search
  What it is: Mobile responsive shell
  ────────────────────────────────────────
  Component / Classes: .sc-page, .sc-process-page
  What it is: Content width containers (740px / 1120px)
  ────────────────────────────────────────
  Component / Classes: .sc-process-layout, .sc-process-main,
    .sc-process-sidebar, .sc-rail-main
  What it is: Two-column detail page layout
  ---
  Modals
  Component: ScModal.svelte
  What it is: Reusable modal wrapper
  ────────────────────────────────────────
  Component: .sc-modal-backdrop, .sc-modal-shell,
    .sc-modal-header, .sc-modal-body, .sc-modal-close
  What it is: Modal chrome
  ────────────────────────────────────────
  Component: ActionEditorModal.svelte
  What it is: Create/edit action form
  ────────────────────────────────────────
  Component: CreateProcessModal.svelte
  What it is: Create process form
  ────────────────────────────────────────
  Component: InlineCreateRoleModal.svelte
  What it is: Inline role creation
  ────────────────────────────────────────
  Component: InlineCreateSystemModal.svelte
  What it is: Inline system creation
  ---
  Detail Page Headers
  ┌────────────────────────────┬───────────────────────────┐
  │         Component          │        What it is         │
  ├────────────────────────────┼───────────────────────────┤
  │ RoleDetailHeader.svelte    │ Role name + avatar + edit │
  ├────────────────────────────┼───────────────────────────┤
  │ ProcessDetailHeader.svelte │ Process name + edit       │
  ├────────────────────────────┼───────────────────────────┤
  │ SystemDetailHeader.svelte  │ System name + edit        │
  └────────────────────────────┴───────────────────────────┘
  ---
  Cards & Lists (composite)
  Component: ProcessOverviewCard.svelte
  What it is: Process summary card
  ────────────────────────────────────────
  Component: ProcessCardList.svelte
  What it is: List of process cards
  ────────────────────────────────────────
  Component: ProcessTraverseCard.svelte
  What it is: Linked process navigation card
  ────────────────────────────────────────
  Component: ProcessActionsSection.svelte
  What it is: Actions section within process detail
  ────────────────────────────────────────
  Component: ProcessActionsPanel.svelte
  What it is: Actions editing panel
  ────────────────────────────────────────
  Component: .sc-process-card, .sc-process-card-content
  What it is: Process card grid layout
  ────────────────────────────────────────
  Component: .sc-action-card, .sc-action-card-main,
    .sc-action-card-side
  What it is: Action card 2-column layout
  ────────────────────────────────────────
  Component: .sc-action-sequence, .sc-action-order-controls,
    .sc-action-order-btn
  What it is: Sequence number + reorder arrows
  ────────────────────────────────────────
  Component: .sc-process-badge-rows, .sc-process-badges
  What it is: Badge rows on process cards
  ────────────────────────────────────────
  Component: .sc-process-facts, .sc-process-fact,
    .sc-process-details-grid
  What it is: Key/value fact boxes
  ---
  ActionCard Bracket (new)
  Classes: RoleProcessGraph.svelte
  What it is: Role page action cards
  ────────────────────────────────────────
  Classes: .ac-wrap, .ac-inline-seq
  What it is: Card row + sequence number
  ────────────────────────────────────────
  Classes: .ac-card, .ac-process-badge
  What it is: Card shell + process label
  ────────────────────────────────────────
  Classes: .ac-body, .ac-desc, .ac-desc--truncated
  What it is: Description grid, 2-line clamp
  ────────────────────────────────────────
  Classes: .ac-fork, .ac-bracket, .ac-tines, .ac-tine,
    .ac-tine-wire
  What it is: ] bracket + wire connectors
  ---
  Flags
  Component: FlagSidebar.svelte
  What it is: Sidebar flag feed
  ────────────────────────────────────────
  Component: FlagsCardList.svelte
  What it is: Flag grid (post-it style)
  ────────────────────────────────────────
  Component: FlagsCreateForm.svelte
  What it is: Flag creation form
  ────────────────────────────────────────
  Component: InlineEntityFlagControl.svelte
  What it is: Hover flag button on entity cards
  ────────────────────────────────────────
  Component: .sc-postit-card, .sc-postit-header,
    .sc-postit-body, .sc-postit-footer
  What it is: Post-it flag card
  ────────────────────────────────────────
  Component: .sc-flag-grid
  What it is: Responsive flag grid
  ────────────────────────────────────────
  Component: .sc-flag-hover-btn, .sc-location-btn
  What it is: Hover-reveal action buttons
  ---
  Rich Text Editor
  Component: RichTextEditor.svelte
  What it is: TipTap/ProseMirror editor
  ────────────────────────────────────────
  Component: RichText.svelte
  What it is: Read-only HTML renderer
  ────────────────────────────────────────
  Component: .sc-rich-editor, .sc-rich-editor-toolbar,
    .sc-rich-editor-btn, .sc-rich-editor-shell
  What it is: Editor chrome
  ---
  Search
  Component: AppSearchOverlay.svelte
  What it is: Cmd+K search modal
  ────────────────────────────────────────
  Component: .sc-search-results, .sc-search-group,
    .sc-search-result, .sc-search-type-pill
  What it is: Search results layout
  ---
  That's 25 Svelte components and roughly 40 distinct CSS
  primitives/patterns across the sc- and ac- namespaces, plus
   the mk- marketing theme (which is a separate design
  system). The marketing tokens (--mk-*) and classes would be
   a second Figma library if you want to cover both.
