export async function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert Blob to base64 data URI"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
