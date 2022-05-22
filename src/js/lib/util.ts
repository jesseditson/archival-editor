import { ObjectChildData, ObjectValue } from "../types";

export const changeId = (
  parentId: string,
  parentField: string,
  index?: number,
  child?: string
) =>
  `${parentId}#${parentField}${
    typeof index === "number" ? `/${index}${child ? `.${child}` : ""}` : ""
  }`;

export const parseChangeId = (changeId: string) => {
  const d = changeId.split("#");
  const f = d.slice(1).join("#").split("/");
  const p = f.slice(1).join("/").split(".");
  const index = parseInt(p[0]);
  return {
    id: d[0],
    field: f[0] || null,
    index: isNaN(index) ? null : index,
    path: p.slice(1).join("."),
  };
};

export const setChildField = (
  object: ObjectChildData[],
  index: number,
  path: string,
  value: ObjectValue
): ObjectChildData[] => {
  object[index] = object[index] || {};
  object[index][path] = value;
  return object;
};

export const DEFAULT_VALUES = {
  string: "",
  markdown: "",
};
