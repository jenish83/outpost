import { getArrowTargetState, type Editor, type TLArrowBinding, type TLBinding, type TLShapeId } from "tldraw";
import {
  entityTableHeight,
  entityTableRowAnchor,
  isEntityTableShape,
  nearestEntityTableRowIndex,
  type EntityTableShape,
} from "./entity-table";

/** Key in an arrow binding's meta. The anchor itself stays in the native binding props. */
export const ENTITY_TABLE_ARROW_ROW_ID = "rowId";

export function entityTableArrowRowId(meta: TLBinding["meta"] | undefined) {
  const value = meta?.[ENTITY_TABLE_ARROW_ROW_ID];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isArrowBinding(binding: TLBinding): binding is TLArrowBinding {
  return binding.type === "arrow";
}

function sameAnchor(
  binding: TLArrowBinding,
  anchor: { x: number; y: number },
  rowId: string,
  snap: TLArrowBinding["props"]["snap"],
) {
  return (
    binding.props.isPrecise &&
    binding.props.snap === snap &&
    entityTableArrowRowId(binding.meta) === rowId &&
    Math.abs(binding.props.normalizedAnchor.x - anchor.x) < 1e-6 &&
    Math.abs(binding.props.normalizedAnchor.y - anchor.y) < 1e-6
  );
}

// Two ends on the same point make a zero-length arrow, so the later end takes the other side.
function separateSharedRow(
  editor: Editor,
  binding: TLArrowBinding,
  shape: EntityTableShape,
  rowId: string,
  anchor: { x: number; y: number },
) {
  const arrow = editor.getShape(binding.fromId);
  if (!arrow || arrow.type !== "arrow") return anchor;
  const other = editor
    .getBindingsFromShape(arrow.id, "arrow")
    .find((item) => item.id !== binding.id && item.props.terminal !== binding.props.terminal);
  if (!other || other.toId !== shape.id) return anchor;
  const otherRowId = entityTableArrowRowId(other.meta);
  const sameRow = otherRowId === rowId || Math.abs(other.props.normalizedAnchor.y - anchor.y) < 1e-4;
  if (!sameRow || Math.abs(other.props.normalizedAnchor.x - anchor.x) > 1e-4) return anchor;
  return { x: anchor.x === 0 ? 1 : 0, y: anchor.y };
}

/**
 * Pin a native arrow binding to a column row.
 * `lockedRowId` keeps an existing connection when rows are inserted or reordered.
 * Without it, the anchor follows the pointer to the nearest row.
 */
export function alignArrowBindingToRow(editor: Editor, binding: TLArrowBinding, lockedRowId?: string | null) {
  const shape = editor.getShape(binding.toId);
  if (!shape || !isEntityTableShape(shape) || shape.props.rows.length === 0) {
    if (!entityTableArrowRowId(binding.meta)) return binding;
    const meta = { ...binding.meta };
    delete meta[ENTITY_TABLE_ARROW_ROW_ID];
    return { ...binding, meta };
  }

  const lockedIndex = lockedRowId ? shape.props.rows.findIndex((row) => row.id === lockedRowId) : -1;
  const height = shape.props.h > 0 ? shape.props.h : entityTableHeight(shape.props.rows.length);
  const index =
    lockedIndex >= 0
      ? lockedIndex
      : nearestEntityTableRowIndex(shape.props.rows.length, binding.props.normalizedAnchor.y * height);
  const row = shape.props.rows[index];
  if (!row) return binding;

  const anchor = separateSharedRow(
    editor,
    binding,
    shape,
    row.id,
    entityTableRowAnchor(shape.props.rows.length, index, binding.props.normalizedAnchor.x),
  );
  // A center snap draws the arrow to the middle of the table and ignores the row anchor.
  const snap = binding.props.snap === "center" ? "none" : binding.props.snap;
  if (sameAnchor(binding, anchor, row.id, snap)) return binding;

  return {
    ...binding,
    props: {
      ...binding.props,
      normalizedAnchor: anchor,
      isPrecise: true,
      snap,
    },
    meta: { ...binding.meta, [ENTITY_TABLE_ARROW_ROW_ID]: row.id },
  };
}

function writeArrowBinding(editor: Editor, binding: TLArrowBinding) {
  editor.updateBinding({
    id: binding.id,
    type: "arrow",
    toId: binding.toId,
    props: binding.props,
    meta: binding.meta,
  });
}

function bindingTargetsRow(binding: TLArrowBinding, shape: EntityTableShape) {
  const rowId = entityTableArrowRowId(binding.meta);
  if (!rowId) return true;
  return shape.props.rows.some((row) => row.id === rowId);
}

function maintainEntityTableArrowBindings(editor: Editor, prev: EntityTableShape, next: EntityTableShape) {
  const sameRows =
    prev.props.h === next.props.h &&
    prev.props.rows.length === next.props.rows.length &&
    prev.props.rows.every((row, index) => row.id === next.props.rows[index]?.id);
  if (sameRows) return;

  for (const binding of editor.getBindingsToShape(next.id, "arrow")) {
    const rowId = entityTableArrowRowId(binding.meta);
    if (next.props.rows.length === 0 || (rowId && !bindingTargetsRow(binding, next))) {
      // isolateShapes writes the arrow terminal at its current point, then drops the binding.
      editor.deleteBindings([binding.id], { isolateShapes: true });
      continue;
    }
    const aligned = alignArrowBindingToRow(editor, binding, rowId);
    if (aligned !== binding) writeArrowBinding(editor, aligned);
  }
}

/** Row under the arrow terminal that is currently being dragged, for either end. */
export function entityTableArrowTargetRowId(editor: Editor, shapeId: TLShapeId) {
  const state = getArrowTargetState(editor);
  if (!state || state.target.id !== shapeId) return null;
  const shape = editor.getShape(shapeId);
  if (!shape || !isEntityTableShape(shape)) return null;
  const local = editor.getPointInShapeSpace(shape, editor.inputs.getCurrentPagePoint());
  const index = nearestEntityTableRowIndex(shape.props.rows.length, local.y);
  return index < 0 ? null : (shape.props.rows[index]?.id ?? null);
}

function alignBindingRecord(editor: Editor, binding: TLBinding) {
  if (!isArrowBinding(binding) || isHistoryReplay(editor)) return binding;
  return alignArrowBindingToRow(editor, binding);
}

// Present on the editor at runtime. The 5.6 typings omit it, but rewriting a replayed
// binding would replace the record undo and redo are restoring.
function isHistoryReplay(editor: Editor) {
  const candidate = editor as Editor & { isReplayingHistory?: () => boolean };
  return candidate.isReplayingHistory?.() ?? false;
}

/**
 * Keep arrow bindings on column rows across create, drag, resize, and row edits.
 * History replay is left alone so undo and redo restore the recorded bindings.
 */
function realignBindingsToShape(editor: Editor, shape: EntityTableShape) {
  for (const binding of editor.getBindingsToShape(shape.id, "arrow")) {
    const aligned = alignArrowBindingToRow(editor, binding, entityTableArrowRowId(binding.meta));
    if (aligned !== binding) writeArrowBinding(editor, aligned);
  }
}

export function registerEntityTableArrowBindings(editor: Editor) {
  const disposeCreate = editor.sideEffects.registerBeforeCreateHandler("binding", (binding) =>
    alignBindingRecord(editor, binding),
  );
  const disposeChange = editor.sideEffects.registerBeforeChangeHandler("binding", (_prev, next) =>
    alignBindingRecord(editor, next),
  );
  const disposeBindingCreated = editor.sideEffects.registerAfterCreateHandler("binding", (binding) => {
    if (isHistoryReplay(editor) || !isArrowBinding(binding)) return;
    const aligned = alignArrowBindingToRow(editor, binding);
    if (aligned !== binding) writeArrowBinding(editor, aligned);
  });
  const disposeShapeCreated = editor.sideEffects.registerAfterCreateHandler("shape", (shape) => {
    if (isHistoryReplay(editor) || !isEntityTableShape(shape)) return;
    realignBindingsToShape(editor, shape);
  });
  const disposeShape = editor.sideEffects.registerAfterChangeHandler("shape", (prev, next) => {
    if (isHistoryReplay(editor)) return;
    if (!isEntityTableShape(prev) || !isEntityTableShape(next)) return;
    maintainEntityTableArrowBindings(editor, prev, next);
  });

  if (!editor.getIsReadonly()) {
    editor.run(
      () => {
        for (const shape of editor.getCurrentPageShapes()) {
          if (!isEntityTableShape(shape)) continue;
          realignBindingsToShape(editor, shape);
        }
      },
      { history: "ignore" },
    );
  }

  return () => {
    disposeCreate();
    disposeChange();
    disposeBindingCreated();
    disposeShapeCreated();
    disposeShape();
  };
}
