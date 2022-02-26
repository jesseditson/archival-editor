import { FC, useState } from "react";
import { EditorProps } from "./types";

interface StringEditorProps extends EditorProps<string> {}

const StringEditor: FC<StringEditorProps> = ({
  initialValue,
  field,
  onUpdate,
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="string-editor">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={field}
      />
      <button onClick={() => onUpdate(value)}>Save</button>
    </div>
  );
};

export default StringEditor;
