// AWS Textract wrapper - isolated so it never crashes the server
// All AWS SDK usage is contained here with full error handling

export interface TextractResult {
  success: boolean;
  text: string;
  error?: string;
}

export async function extractTextFromDocument(fileBuffer: Buffer): Promise<TextractResult> {
  try {
    // Dynamic import to prevent bundler issues with AWS SDK
    const { TextractClient, DetectDocumentTextCommand } = await import('@aws-sdk/client-textract');

    const region = process.env.AWS_REGION ?? 'us-east-1';
    const client = new TextractClient({ region });

    const result = await client.send(
      new DetectDocumentTextCommand({ Document: { Bytes: fileBuffer } })
    );

    const text = result.Blocks
      ?.filter((b) => b.BlockType === 'LINE')
      .map((b) => b.Text ?? '')
      .join('\n') ?? '';

    return { success: true, text };
  } catch (err: any) {
    console.warn('[Textract] extraction failed (non-fatal):', err?.message ?? String(err));
    return { success: false, text: '', error: String(err?.message ?? err) };
  }
}

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<{ success: boolean; key: string; error?: string }> {
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const region = process.env.AWS_REGION ?? 'us-east-1';
    const bucket = process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET ?? '';

    if (!bucket) {
      return { success: false, key, error: 'S3_BUCKET not configured' };
    }

    const s3 = new S3Client({ region });
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mimeType }));

    return { success: true, key };
  } catch (err: any) {
    console.warn('[S3] upload failed (non-fatal):', err?.message ?? String(err));
    return { success: false, key, error: String(err?.message ?? err) };
  }
}
