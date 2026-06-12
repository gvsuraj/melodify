export function getDirectDownloadLink(sharedLink: string): string {
  let url = sharedLink.replace("dl=0", "dl=1");
  url = url.replace("www.dropbox.com", "dl.dropbox.com");
  return url;
}
