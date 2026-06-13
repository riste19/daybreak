"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Heading,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  Type,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CHROME_ROLES,
  makeSectionId,
  type ChromeRole,
  type EmailLayout,
  type EmailSection,
} from "@/lib/email/layout";

/**
 * The email builder — arrange the daily email as a draggable stack of sections.
 * Reorder by dragging; toggle chrome on/off; add text and AI blocks. Each text
 * block chooses its handling: "Show as-is" (verbatim, rendered as typed, the
 * model never sees it) or "Hand to AI" (the model weaves it in — not shown as
 * its own block). Edits flow up through onChange as a single EmailLayout.
 */

const CHROME_LABELS: Record<ChromeRole, string> = {
  header: "Dawn header + logo",
  heading: "Subject heading",
  signature: "Signature",
  meta: "Tone / theme strip",
  footer: "Footer + unsubscribe",
};

const CHROME_ICONS: Record<ChromeRole, React.ComponentType<{ className?: string }>> = {
  header: Sun,
  heading: Heading,
  signature: Type,
  meta: Sparkles,
  footer: Type,
};

function dndId(section: EmailSection): string {
  return section.kind === "chrome" ? `chrome:${section.role}` : `${section.kind}:${section.id}`;
}

interface EmailBuilderProps {
  layout: EmailLayout;
  onChange: (layout: EmailLayout) => void;
}

export function EmailBuilder({ layout, onChange }: EmailBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = layout.sections.map(dndId);

  const setSections = (sections: EmailSection[]) => onChange({ ...layout, sections });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    setSections(arrayMove(layout.sections, from, to));
  };

  const removeAt = (id: string) =>
    setSections(layout.sections.filter((s) => dndId(s) !== id));

  const updateText = (id: string, patch: Partial<Extract<EmailSection, { kind: "text" }>>) =>
    setSections(
      layout.sections.map((s) =>
        s.kind === "text" && s.id === id ? { ...s, ...patch } : s,
      ),
    );

  const addText = () =>
    setSections([
      ...layout.sections,
      { kind: "text", id: makeSectionId("t"), text: "", handling: "verbatim" },
    ]);

  const addChrome = (role: ChromeRole) =>
    setSections([...layout.sections, { kind: "chrome", role }]);

  const presentRoles = new Set(
    layout.sections.filter((s) => s.kind === "chrome").map((s) => (s as { role: ChromeRole }).role),
  );
  const missingRoles = CHROME_ROLES.filter((r) => !presentRoles.has(r));

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {layout.sections.map((section) => (
              <SortableRow
                key={dndId(section)}
                id={dndId(section)}
                section={section}
                onRemove={() => removeAt(dndId(section))}
                onUpdateText={updateText}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {/* Add palette */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">Add</span>
        <AddButton icon={Type} label="Text block" onClick={addText} />
        {missingRoles.map((role) => (
          <AddButton
            key={role}
            icon={CHROME_ICONS[role]}
            label={CHROME_LABELS[role]}
            onClick={() => addChrome(role)}
          />
        ))}
      </div>
    </div>
  );
}

function AddButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-secondary"
    >
      <Plus className="size-3.5 text-primary" />
      <Icon className="size-3.5 text-ink-soft" />
      {label}
    </button>
  );
}

function SortableRow({
  id,
  section,
  onRemove,
  onUpdateText,
}: {
  id: string;
  section: EmailSection;
  onRemove: () => void;
  onUpdateText: (id: string, patch: Partial<Extract<EmailSection, { kind: "text" }>>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border bg-card p-2.5",
        isDragging && "ring-2 ring-primary/40",
      )}
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 touch-none rounded p-1 text-ink-soft hover:bg-secondary hover:text-ink"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        {section.kind === "chrome" && <ChromeRow role={section.role} />}
        {section.kind === "ai" && <AiRow />}
        {section.kind === "text" && (
          <TextRow section={section} onUpdate={(patch) => onUpdateText(section.id, patch)} />
        )}
      </div>

      {/* The AI message is fixed (exactly one); everything else can be removed. */}
      {section.kind !== "ai" ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove section"
          className="mt-0.5 shrink-0 rounded p-1 text-ink-soft transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          {section.kind === "chrome" ? <X className="size-4" /> : <Trash2 className="size-4" />}
        </button>
      ) : (
        <span className="w-6 shrink-0" aria-hidden />
      )}
    </li>
  );
}

function ChromeRow({ role }: { role: ChromeRole }) {
  const Icon = CHROME_ICONS[role];
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon className="size-4 text-ink-soft" />
      <span className="text-sm font-medium text-ink">{CHROME_LABELS[role]}</span>
      <span className="font-mono text-xs text-ink-soft">· system</span>
    </div>
  );
}

function AiRow() {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Sparkles className="size-4 text-primary" />
      <span className="text-sm font-medium text-ink">AI message</span>
      <span className="text-xs text-ink-soft">written fresh for each morning</span>
    </div>
  );
}

function TextRow({
  section,
  onUpdate,
}: {
  section: Extract<EmailSection, { kind: "text" }>;
  onUpdate: (patch: Partial<Extract<EmailSection, { kind: "text" }>>) => void;
}) {
  return (
    <div className="space-y-2 py-0.5">
      <div className="flex items-center gap-2">
        <Type className="size-4 text-ink-soft" />
        <span className="text-sm font-medium text-ink">Your text</span>
      </div>
      <textarea
        value={section.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Type your words…"
        rows={2}
        maxLength={500}
        className="w-full resize-y rounded-md border border-border bg-secondary px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/40"
      />
      <p className="text-xs text-ink-soft">Shown in your email exactly as typed.</p>
    </div>
  );
}
