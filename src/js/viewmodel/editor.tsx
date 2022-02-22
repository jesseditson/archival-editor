import React from "react"
import { observer } from "mobx-react-lite"
import Editor from "../editor"

const EditorVM = observer(({editorData}) => <Editor data={editorData}/>)
export default EditorVM