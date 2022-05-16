import { Change, ObjectData } from "../types";

export const childId = (parent: string, index: number, child: string) =>
  `${parent}.${index}.${child}`;

export const changeId = (o: Change | ObjectData, f?: string) =>
  f ? `${(o as ObjectData)._id}#${f}` : `${o.id}#${o.field}`;
