import { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import https, { RequestOptions } from "https";
import http from "http";

const proxy = (
  method: string,
  url: string,
  body: string,
  headers: HandlerEvent["headers"]
) => {
  const u = new URL(url);

  const requestOptions: RequestOptions = {
    host: u.host,
    path: u.pathname,
    method,
    headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
  };

  const httpLib = u.protocol === "http" ? http : https;

  return new Promise<HandlerResponse>((resolve) => {
    const req = httpLib.request(requestOptions, (res) => {
      if (new Set(Object.keys(res.headers)).has("location")) {
        // Modify the location so the client continues to use the proxy
        const newUrl = res.headers.location?.replace(/^https?:\//, "");
        res.headers.location = newUrl;
      }
      const headers: HandlerResponse["headers"] = {};
      Object.keys(res.headers).forEach((key) => {
        headers[key] = res.headers[key]!.toString();
      });
      // Ideally we'd pipe res instead of buffering, but it doesn't seem like netlify handlers expose a response object:
      // https://answers.netlify.com/t/stream-content-to-function-response-body/3558
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 500,
          headers,
          body,
        });
      });
    });
    req.write(body);
    req.end();
  });
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      body: "",
    };
  }

  return proxy(event.httpMethod, event.rawUrl, event.body || "", event.headers);
};
