import {
  ObjectData,
  ObjectDefinition,
  ObjectValue,
  ScalarType,
  ValidationError,
} from "../types";

export interface EditorProps<T extends ObjectValue> {
  definition: ObjectDefinition;
  object: ObjectData;
  onUpdate: (value: T) => Promise<ValidationError | void>;
  isUnsaved: boolean;
  field: string;
  disabled: boolean;
  type: ScalarType;
  initialValue: T;
}
