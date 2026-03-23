import crypto from "crypto";

export function createHmacSignature(
  secret: string,
  rawBody: string
): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyHmacSignature(params: {
  secret: string;
  rawBody: string;
  signature: string;
}) {
  const expected = createHmacSignature(params.secret, params.rawBody);

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(params.signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}