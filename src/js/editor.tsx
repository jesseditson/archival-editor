import React, {FC} from "react"
import EditorData from "./model/editor"

interface EditorProps {
    data: EditorData
}

const Editor: FC<EditorProps> = () => {
    return <div className="editor">
        Editor
    </div>
}

export default Editor
