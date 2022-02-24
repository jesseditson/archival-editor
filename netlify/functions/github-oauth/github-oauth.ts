import { Handler, HandlerResponse } from "@netlify/functions";
import https from "https";
import qs from "querystring";

export const handler: Handler = async (event, context) => {
  const { code, state } = event.queryStringParameters!;

  if (!code || !state) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid Request" }),
    };
  }

  const data = JSON.stringify({
    client_id: process.env.GITHUB_CLIENT_ID!,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
  });

  const postOptions = {
    host: "github.com",
    path: "/login/oauth/access_token",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
      Accept: "application/json",
    },
  };

  return new Promise<HandlerResponse>((resolve) => {
    const req = https.request(postOptions, (res) => {
      res.setEncoding("utf8");
      let responseStr = "";
      res.on("data", (chunk: Buffer) => {
        responseStr += chunk.toString();
      });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          console.log(responseStr);
          return resolve({
            statusCode: 302,
            headers: {
              Location: `${
                process.env.GITHUB_AUTHORIZED_APP_URL
              }?statusMessage=${encodeURIComponent(
                res.statusMessage || "Unknown"
              )}`,
            },
          });
        }
        const responseData = JSON.parse(responseStr);
        resolve({
          statusCode: 302,
          headers: {
            Location: `${process.env.GITHUB_AUTHORIZED_APP_URL}?${qs.stringify(
              responseData
            )}`,
          },
        });
      });
    });
    req.write(data);
    req.end();
  });
};
