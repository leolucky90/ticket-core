import "server-only";
import { ImageAnnotatorClient } from "@google-cloud/vision";

let client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
    if (client) return client;

    const email = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const key = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

    if (!email || !key || !projectId) {
        throw new Error(
            "Missing Google Cloud Vision env: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_CLIENT_EMAIL, GOOGLE_CLOUD_PRIVATE_KEY",
        );
    }

    client = new ImageAnnotatorClient({
        credentials: {
            client_email: email,
            private_key: key,
        },
        projectId,
    });

    return client;
}

export async function runGoogleVisionOcr(buffer: Buffer): Promise<string> {
    const c = getClient();
    const [result] = await c.documentTextDetection({
        image: { content: buffer },
    });

    return result.fullTextAnnotation?.text ?? "";
}
