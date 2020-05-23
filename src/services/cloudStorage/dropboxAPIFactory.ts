export const enum DropboxMethods {
  Upload = "upload",
  Delete = "delete",
  DownloadAll = "downloadAll"
}

const dropboxMethodMap = {
  upload: ["content", "upload"],
  delete: ["api", "delete_v2"],
  downloadAll: ["content", "download_zip"]
};

export function dropboxAPIFactory(method: DropboxMethods): string {
  const chosenMethod = dropboxMethodMap[method];
  return `https://${chosenMethod[0]}.dropboxapi.com/2/files/${chosenMethod[1]}`;
}
