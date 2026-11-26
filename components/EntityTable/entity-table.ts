import {
  T,
  TLShape,
  type Editor,
  type RecordProps,
  createShapePropsMigrationIds,
  createShapePropsMigrationSequence,
} from "tldraw";

export const ENTITY_TABLE_TYPE = "entity-table";

export const ENTITY_TABLE_HEADER_HEIGHT = 36;
export const ENTITY_TABLE_ROW_HEIGHT = 28;
export const ENTITY_TABLE_MIN_WIDTH = 240;
export const ENTITY_TABLE_DEFAULT_WIDTH = 300;

export interface EntityTableRow {
  id: string;
  name: string;
  dataType: string;
  isPK: boolean;
  isFK: boolean;
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    [ENTITY_TABLE_TYPE]: {
      w: number;
      h: number;
      tableName: string;
      rows: EntityTableRow[];
    };
  }
}

export type EntityTableShape = TLShape<typeof ENTITY_TABLE_TYPE>;

export const entityTableRowValidator = T.object({
  id: T.string,
  name: T.string,
  dataType: T.string,
  isPK: T.boolean,
  isFK: T.boolean,
});

export const entityTableProps: RecordProps<EntityTableShape> = {
  w: T.number,
  h: T.number,
  tableName: T.string,
  rows: T.arrayOf(entityTableRowValidator),
};

const versions = createShapePropsMigrationIds(ENTITY_TABLE_TYPE, {
  AddRows: 1,
});

// The first canvas tables stored a name and a newline-separated column list.
export const entityTableMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: versions.AddRows,
      up(props) {
        if (typeof props.tableName === "string" && Array.isArray(props.rows)) {
          props.h = entityTableHeight(props.rows.length);
          return;
        }
        const tableName = typeof props.name === "string" && props.name.trim() ? props.name : "Table";
        const columnText = typeof props.columns === "string" ? props.columns : "id";
        const names = columnText
          .split("\n")
          .map((line: string) => line.trim())
          .filter(Boolean);
        const source = names.length > 0 ? names : ["id"];
        props.tableName = tableName;
        props.rows = source.map((name: string, index: number) => ({
          id: `legacy-${index}-${name}`,
          name,
          dataType: name === "id" ? "uuid" : "text",
          isPK: name === "id",
          isFK: false,
        }));
        props.h = entityTableHeight(props.rows.length);
        delete props.name;
        delete props.columns;
      },
      down(props) {
        const rows = Array.isArray(props.rows) ? props.rows : [];
        props.name = typeof props.tableName === "string" ? props.tableName : "Table";
        props.columns = rows.map((row: { name?: string }) => row.name ?? "").join("\n");
        delete props.tableName;
        delete props.rows;
      },
    },
  ],
});

export function entityTableHeight(rowCount: number) {
  return ENTITY_TABLE_HEADER_HEIGHT + Math.max(0, rowCount) * ENTITY_TABLE_ROW_HEIGHT;
}

export function isEntityTableShape(shape: { type: string }): shape is EntityTableShape {
  return shape.type === ENTITY_TABLE_TYPE;
}

export function createEntityTableRow(partial?: Partial<EntityTableRow>): EntityTableRow {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    name: partial?.name ?? "column",
    dataType: partial?.dataType ?? "text",
    isPK: partial?.isPK ?? false,
    isFK: partial?.isFK ?? false,
  };
}

export function createStarterEntityTableProps(): EntityTableShape["props"] {
  const rows = [
    createEntityTableRow({ name: "id", dataType: "uuid", isPK: true }),
    createEntityTableRow({ name: "created_at", dataType: "timestamptz" }),
  ];
  return {
    w: ENTITY_TABLE_DEFAULT_WIDTH,
    h: entityTableHeight(rows.length),
    tableName: "Table",
    rows,
  };
}

export function rowAtLocalY(rows: EntityTableRow[], y: number) {
  if (rows.length === 0 || y < ENTITY_TABLE_HEADER_HEIGHT) return null;
  const index = Math.min(
    rows.length - 1,
    Math.max(0, Math.floor((y - ENTITY_TABLE_HEADER_HEIGHT) / ENTITY_TABLE_ROW_HEIGHT)),
  );
  return rows[index] ?? null;
}

/** Vertical center of a column row, in the table's local space. */
export function entityTableRowCenterY(rowIndex: number) {
  return ENTITY_TABLE_HEADER_HEIGHT + (rowIndex + 0.5) * ENTITY_TABLE_ROW_HEIGHT;
}

/** Nearest column row for a local y. The header belongs to the first row. */
export function nearestEntityTableRowIndex(rowCount: number, localY: number) {
  if (rowCount <= 0) return -1;
  const index = Math.round((localY - ENTITY_TABLE_HEADER_HEIGHT) / ENTITY_TABLE_ROW_HEIGHT - 0.5);
  return Math.min(rowCount - 1, Math.max(0, index));
}

/** Normalized anchor on the left or right edge of a column row. */
export function entityTableRowAnchor(rowCount: number, rowIndex: number, normalizedX: number) {
  const y = entityTableRowCenterY(rowIndex) / entityTableHeight(rowCount);
  return { x: normalizedX < 0.5 ? 0 : 1, y };
}

export function updateEntityTableProps(
  editor: Editor,
  shape: EntityTableShape,
  props: Partial<Pick<EntityTableShape["props"], "tableName" | "rows" | "w">>,
) {
  const rows = props.rows ?? shape.props.rows;
  editor.updateShape({
    id: shape.id,
    type: ENTITY_TABLE_TYPE,
    props: {
      tableName: props.tableName ?? shape.props.tableName,
      rows,
      w: props.w ?? shape.props.w,
      h: entityTableHeight(rows.length),
    },
  });
}

// Height is derived from the rows, so a resize or paste cannot leave h out of date.
export function registerEntityTableHeight(editor: Editor) {
  const fix = <T extends { type: string; props: object }>(record: T): T => {
    if (!isEntityTableShape(record)) return record;
    const h = entityTableHeight(record.props.rows.length);
    if (record.props.h === h) return record;
    return { ...record, props: { ...record.props, h } };
  };
  const disposeCreate = editor.sideEffects.registerBeforeCreateHandler("shape", (record) => fix(record));
  const disposeChange = editor.sideEffects.registerBeforeChangeHandler("shape", (_prev, next) => fix(next));
  return () => {
    disposeCreate();
    disposeChange();
  };
}
