"use client";

import {
  Group2d,
  HTMLContainer,
  Polyline2d,
  Rectangle2d,
  ShapeUtil,
  Vec,
  type HandleSnapGeometry,
  type TLResizeInfo,
  type TLShapeUtilCanBindOpts,
} from "tldraw";
import {
  ENTITY_TABLE_MIN_WIDTH,
  ENTITY_TABLE_TYPE,
  createStarterEntityTableProps,
  entityTableHeight,
  entityTableMigrations,
  entityTableProps,
  entityTableRowCenterY,
  rowAtLocalY,
  type EntityTableShape,
} from "./entity-table";
import { entityTableEditTarget, EntityTableView } from "./EntityTableView";

export class EntityTableShapeUtil extends ShapeUtil<EntityTableShape> {
  static override type = ENTITY_TABLE_TYPE;
  static override props = entityTableProps;
  static override migrations = entityTableMigrations;

  override getDefaultProps(): EntityTableShape["props"] {
    return createStarterEntityTableProps();
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return true;
  }

  override isAspectRatioLocked() {
    return false;
  }

  // Arrows bind to a table so a relationship can point at one of its columns.
  override canBind({ bindingType }: TLShapeUtilCanBindOpts<EntityTableShape>) {
    return bindingType === "arrow";
  }

  override getGeometry(shape: EntityTableShape) {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true });
  }

  // Handle snapping follows each column row. The table outline is not a snap target.
  override getHandleSnapGeometry(shape: EntityTableShape): HandleSnapGeometry {
    if (shape.props.rows.length === 0) return { outline: null };
    const points = shape.props.rows.flatMap((_, index) => {
      const y = entityTableRowCenterY(index);
      return [
        { x: 0, y },
        { x: shape.props.w, y },
      ];
    });
    return {
      outline: new Group2d({
        children: shape.props.rows.map((_, index) => {
          const y = entityTableRowCenterY(index);
          return new Polyline2d({ points: [new Vec(0, y), new Vec(shape.props.w, y)] });
        }),
      }),
      points,
    };
  }

  // Vertical handles do nothing: height is the header plus one fixed row per column.
  override onResize(shape: EntityTableShape, info: TLResizeInfo<EntityTableShape>) {
    const initial = info.initialShape;
    const h = entityTableHeight(initial.props.rows.length);
    if (info.mode === "resize_bounds" && (info.handle === "top" || info.handle === "bottom")) {
      return { x: initial.x, y: initial.y, props: { w: initial.props.w, h } };
    }

    const fromLeft = info.handle === "left" || info.handle === "top_left" || info.handle === "bottom_left";
    const w = Math.max(ENTITY_TABLE_MIN_WIDTH, initial.props.w * Math.abs(info.scaleX));
    const x =
      info.mode === "resize_bounds" ? (fromLeft ? initial.x + initial.props.w - w : initial.x) : info.newPoint.x;
    const y = info.mode === "resize_bounds" ? initial.y : info.newPoint.y;
    return { x, y, props: { w, h } };
  }

  override onDoubleClick(shape: EntityTableShape) {
    const point = this.editor.getPointInShapeSpace(shape, this.editor.inputs.getCurrentPagePoint());
    const row = rowAtLocalY(shape.props.rows, point.y);
    entityTableEditTarget.set({ shapeId: shape.id, rowId: row?.id ?? null });
  }

  override component(shape: EntityTableShape) {
    return (
      <HTMLContainer>
        <EntityTableView shape={shape} />
      </HTMLContainer>
    );
  }

  override getIndicatorPath(shape: EntityTableShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 8);
    return path;
  }
}
