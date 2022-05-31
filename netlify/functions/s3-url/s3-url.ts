import { Handler, HandlerResponse } from "@netlify/functions";
import AWS from "aws-sdk";
const s3Key = process.env.S3_KEY;
const s3Secret = process.env.S3_SECRET;
export const s3Bucket = "archival-editor-uploads";

AWS.config.update({
  accessKeyId: s3Key,
  secretAccessKey: s3Secret,
  signatureVersion: "v4",
  region: "us-west-2",
});

export const s3 = new AWS.S3();

export const handler: Handler = async (event, context) => {
  let filename;
  let repo;
  try {
    const body = JSON.parse(event.body || "");
    filename = body.filename;
    repo = body.repo;
  } catch (e) {
    console.error("Error parsing body:", (e as Error).stack);
  }
  if (!filename || !repo) {
    return {
      statusCode: 406,
      body: JSON.stringify({ error: "filename and repo name required" }),
    };
  }
  try {
    const url = await s3.getSignedUrlPromise("putObject", {
      Bucket: s3Bucket,
      Key: `${repo}/${filename}`,
    });
    return { statusCode: 200, body: JSON.stringify({ url }) };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: (e as Error).message }),
    };
  }
};
