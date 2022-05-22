import { createContext } from "react";

export interface FileUploadContextProps {
  onUpload: (file: File) => Promise<string>;
}

export const FileUploadContext = createContext<FileUploadContextProps>({
  onUpload: () => {
    throw new Error("onUpload not implemented.");
  },
});
