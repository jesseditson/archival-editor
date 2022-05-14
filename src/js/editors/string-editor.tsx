import { FC, useState } from "react";
import { EditorProps } from "./types";

interface StringEditorProps extends EditorProps<string> {}

export const StringEditor: FC<StringEditorProps> = ({
  initialValue,
  field,
  disabled,
  onUpdate,
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="string-editor">
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        placeholder={field}
      />
      {!disabled && <button onClick={() => onUpdate(value)}>Save</button>}
    </div>
  );
};
