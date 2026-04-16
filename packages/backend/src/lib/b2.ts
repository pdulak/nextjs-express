import B2 from "backblaze-b2";
import crypto from "crypto";

function createB2Client() {
  return new B2({
    applicationKeyId: process.env.BACKBLAZE_KEY_ID || "",
    applicationKey: process.env.BACKBLAZE_APPLICATION_KEY || "",
  });
}

export async function authorizeAndGetUploadUrl(bucketId: string) {
  const b2 = createB2Client();
  await b2.authorize();
  const response = await b2.getUploadUrl({ bucketId });
  return {
    uploadUrl: response.data.uploadUrl as string,
    authorizationToken: response.data.authorizationToken as string,
  };
}

export async function uploadFileToB2(
  uploadUrl: string,
  authorizationToken: string,
  fileName: string,
  data: Buffer,
  mimeType: string
) {
  const sha1 = crypto.createHash("sha1").update(data).digest("hex");
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(fileName),
      "Content-Type": mimeType,
      "Content-Length": String(data.length),
      "X-Bz-Content-Sha1": sha1,
    },
    body: data,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`B2 upload failed (${response.status}): ${text}`);
  }

  return response.json();
}
