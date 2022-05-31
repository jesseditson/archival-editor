export default (
  url: string,
  data: File,
  progress: (percent: number) => void
) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    const handleEvent = (ev: ProgressEvent) => {
      progress(ev.loaded / ev.total);
    };
    xhr.upload.addEventListener("loadstart", handleEvent);
    xhr.upload.addEventListener("load", handleEvent);
    xhr.upload.addEventListener("loadend", resolve);
    xhr.upload.addEventListener("progress", handleEvent);
    xhr.upload.addEventListener("error", reject);
    xhr.upload.addEventListener("abort", reject);
    xhr.send(data);
  });
};
