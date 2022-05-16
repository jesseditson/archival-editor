import { Change } from "../types";

export const childChangeId = (parent: string, index: number, child: string) =>
  `${parent}.${index}.${child}`;

export const changeId = (o: Change | string, f?: string) =>
  f ? `${o as string}#${f}` : `${(o as Change).id}#${(o as Change).field}`;

export const DEFAULT_VALUES = {
  string: "",
  markdown: "",
};
