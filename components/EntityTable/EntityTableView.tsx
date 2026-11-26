"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent, type RefObject } from "react";
import { atom, useEditor, useValue, type TLShapeId } from "tldraw";
import { entityTableArrowTargetRowId } from "./entityTableArrowBinding";
import {
  ENTITY_TABLE_HEADER_HEIGHT,
  ENTITY_TABLE_ROW_HEIGHT,
  createEntityTableRow,
  updateEntityTableProps,
  type EntityTableRow,
  type EntityTableShape,
} from "./entity-table";

export const entityTableEditTarget = atom<{ shapeId: TLShapeId; rowId: string | null } | null>(
  "entity-table-edit-target",
  null,
);

const color = {
  bg: "oklch(0.16 0.005 285)",
  header: "oklch(0.23 0.02 55)",
  text: "oklch(0.97 0.002 285)",
  muted: "oklch(0.64 0.01 285)",
  line: "oklch(1 0 0 / 12%)",
  primary: "oklch(0.74 0.16 55)",
  primaryText: "oklch(0.18 0.02 55)",
  input: "oklch(0 0 0 / 28%)",
  danger: "oklch(0.72 0.17 25)",
};

export function EntityTableView({ shape }: { shape: EntityTableShape }) {
  const editor = useEditor();
  const nameInput = useRef<HTMLInputElement>(null);
  const isEditing = useValue("entity-table-editing", () => editor.getEditingShapeId() === shape.id, [editor, shape.id]);
  const target = useValue("entity-table-target", () => entityTableEditTarget.get(), [editor]);
  const arrowTargetRowId = useValue(
    "entity-table-arrow-row",
    () => entityTableArrowTargetRowId(editor, shape.id),
    [editor, shape.id],
  );
  const rowBeingEdited =
    isEditing && target?.shapeId === shape.id
      ? (shape.props.rows.find((row) => row.id === target.rowId) ?? null)
      : null;
  const editingTable = isEditing && !rowBeingEdited;
  const focusKey = !isEditing ? null : (rowBeingEdited?.id ?? "table");

  useEffect(() => {
    if (!focusKey) return;
    const input = nameInput.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [focusKey]);

  const stopEditorPointer = (event: PointerEvent) => {
    editor.markEventAsHandled(event);
  };

  return (
    <div
      role="group"
      aria-label={`${shape.props.tableName || "Untitled"} table`}
      style={{
        width: shape.props.w,
        height: shape.props.h,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 8,
        background: color.bg,
        color: color.text,
        boxShadow: `inset 0 0 0 1px ${color.line}`,
        fontFamily: "var(--font-geist-sans), sans-serif",
        userSelect: "none",
        pointerEvents: "all",
      }}
      onDoubleClick={(event) => {
        const rowId = (event.target as HTMLElement).closest?.("[data-row-id]")?.getAttribute("data-row-id") ?? null;
        entityTableEditTarget.set({ shapeId: shape.id, rowId });
        editor.setEditingShape(shape.id);
      }}
      onKeyDown={
        isEditing
          ? (event) => {
              if (event.key === "Escape") return;
              editor.markEventAsHandled(event);
            }
          : undefined
      }
    >
      <div
        style={{
          height: ENTITY_TABLE_HEADER_HEIGHT,
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 8px",
          background: color.header,
          borderBottom: `1px solid color-mix(in oklch, ${color.primary} 45%, transparent)`,
        }}
      >
        {editingTable ? (
          <input
            ref={nameInput}
            aria-label="Table name"
            value={shape.props.tableName}
            placeholder="Table name"
            onPointerDown={stopEditorPointer}
            onChange={(event) => updateEntityTableProps(editor, shape, { tableName: event.target.value })}
            style={inputStyle}
          />
        ) : (
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 13,
              fontWeight: 650,
            }}
          >
            {shape.props.tableName || "Untitled"}
          </span>
        )}
        {editingTable && (
          <button
            type="button"
            aria-label="Add row"
            title="Add row"
            onPointerDown={stopEditorPointer}
            onClick={() =>
              updateEntityTableProps(editor, shape, {
                rows: [...shape.props.rows, createEntityTableRow()],
              })
            }
            style={toolButtonStyle()}
          >
            + Add
          </button>
        )}
      </div>
      {shape.props.rows.map((row) =>
        row.id === rowBeingEdited?.id ? (
          <RowEditor
            key={row.id}
            row={row}
            nameRef={nameInput}
            onPointerDown={stopEditorPointer}
            onChange={(patch) =>
              updateEntityTableProps(editor, shape, {
                rows: shape.props.rows.map((item) => (item.id === row.id ? { ...item, ...patch } : item)),
              })
            }
            onDelete={() =>
              updateEntityTableProps(editor, shape, {
                rows: shape.props.rows.filter((item) => item.id !== row.id),
              })
            }
          />
        ) : (
          <div
            key={row.id}
            data-row-id={row.id}
            data-arrow-target={arrowTargetRowId === row.id ? "true" : undefined}
            style={{
              height: ENTITY_TABLE_ROW_HEIGHT,
              flex: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 8px",
              borderTop: `1px solid ${color.line}`,
              fontSize: 12,
              background: arrowTargetRowId === row.id ? "oklch(0.74 0.16 55 / 24%)" : undefined,
              boxShadow: arrowTargetRowId === row.id ? "inset 2px 0 0 oklch(0.74 0.16 55)" : undefined,
            }}
          >
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.name || "unnamed"}
            </span>
            <span style={typeStyle}>{row.dataType}</span>
            {row.isPK && <Badge kind="pk">PK</Badge>}
            {row.isFK && <Badge kind="fk">FK</Badge>}
          </div>
        ),
      )}
    </div>
  );
}

function RowEditor({
  row,
  nameRef,
  onPointerDown,
  onChange,
  onDelete,
}: {
  row: EntityTableRow;
  nameRef: RefObject<HTMLInputElement | null>;
  onPointerDown: (event: PointerEvent) => void;
  onChange: (patch: Partial<EntityTableRow>) => void;
  onDelete: () => void;
}) {
  return (
    <div
      data-row-id={row.id}
      style={{
        height: ENTITY_TABLE_ROW_HEIGHT,
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "0 6px",
        borderTop: `1px solid ${color.line}`,
      }}
    >
      <input
        ref={nameRef}
        aria-label="Column name"
        value={row.name}
        onPointerDown={onPointerDown}
        onChange={(event) => onChange({ name: event.target.value })}
        style={{ ...inputStyle, flex: "1 1 0", minWidth: 0 }}
      />
      <input
        aria-label="Data type"
        value={row.dataType}
        onPointerDown={onPointerDown}
        onChange={(event) => onChange({ dataType: event.target.value })}
        style={{ ...inputStyle, ...typeStyle, flex: "0 0 92px", width: 92 }}
      />
      <button
        type="button"
        aria-label="Primary key"
        aria-pressed={row.isPK}
        title="Primary key"
        onPointerDown={onPointerDown}
        onClick={() => onChange({ isPK: !row.isPK })}
        style={toolButtonStyle(row.isPK)}
      >
        PK
      </button>
      <button
        type="button"
        aria-label="Foreign key"
        aria-pressed={row.isFK}
        title="Foreign key"
        onPointerDown={onPointerDown}
        onClick={() => onChange({ isFK: !row.isFK })}
        style={toolButtonStyle(row.isFK)}
      >
        FK
      </button>
      <button
        type="button"
        aria-label="Delete row"
        title="Delete row"
        onPointerDown={onPointerDown}
        onClick={onDelete}
        style={{ ...toolButtonStyle(), color: color.danger, width: 18 }}
      >
        ×
      </button>
    </div>
  );
}

function Badge({ kind, children }: { kind: "pk" | "fk"; children: string }) {
  const pk = kind === "pk";
  return (
    <span
      style={{
        flex: "none",
        height: 14,
        padding: "0 4px",
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.04em",
        lineHeight: "14px",
        background: pk ? color.primary : "oklch(0.74 0.16 55 / 16%)",
        color: pk ? color.primaryText : "oklch(0.86 0.1 70)",
      }}
    >
      {children}
    </span>
  );
}

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 22,
  margin: 0,
  padding: "0 6px",
  border: `1px solid oklch(1 0 0 / 16%)`,
  borderRadius: 4,
  background: color.input,
  color: color.text,
  font: "inherit",
  fontSize: 12,
  outline: "none",
  userSelect: "text",
};

const typeStyle: CSSProperties = {
  flex: "none",
  color: color.muted,
  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  fontSize: 11,
};

function toolButtonStyle(active = false): CSSProperties {
  return {
    flex: "none",
    height: 18,
    margin: 0,
    padding: "0 5px",
    borderRadius: 4,
    border: active ? "1px solid transparent" : `1px solid ${color.line}`,
    background: active ? color.primary : "transparent",
    color: active ? color.primaryText : color.muted,
    font: "inherit",
    fontSize: 10,
    fontWeight: 700,
    lineHeight: "16px",
    cursor: "pointer",
  };
}
