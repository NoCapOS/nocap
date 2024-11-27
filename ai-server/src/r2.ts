import { AwsClient } from "aws4fetch";

const r2 = new AwsClient({
  accessKeyId: "24969579d231ba11c352a6c20399f785",
  secretAccessKey: "a8c0432eb45db3fc0125865c5b7ebac6376351ab5ed19798ae8c97a412600564",
});
const bucketName = "nocapcreator-media";
const accountId = "e000fd54b7b6ed35d4d7a01f0b82041e";
const r2Url = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`

export const uploadMedia = async (name: string, body: any) => {
  const url = new URL(r2Url);
  url.pathname = name;
  url.searchParams.set("X-Amz-Expires", "3600");

  const signed = await r2.sign(
    new Request(url, {
      method: "PUT",
    }),
    {
      aws: { signQuery: true },
    }
  );

  await fetch(signed.url, {
    method: "PUT",
    body: body,
  });
}
