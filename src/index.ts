import fs from 'fs';
import sharp from 'sharp';
import AWS from 'aws-sdk';
import stream from 'stream';
import { promisify } from 'util';

const s3 = new AWS.S3();

const writeStreamToS3 = (Bucket: string, Key: string, ContentType: string) => {
  const pass = new stream.PassThrough();
  return {
    writeStream: pass,
    uploadFinished: s3.upload({
      Body: pass,
      Bucket,
      ContentType,
      Key,
    }).promise(),
  };
};

const streamToSharp = (width: number, height: number) => sharp({ failOnError: false })
  .resize(width, height);

(async () => {
  try {
    const imageDataUri = fs.readFileSync('./image.txt', { encoding: 'utf8' })
      .replace(/^data:image\/[\w+]+;base64,/, '');

    const imageBuffer = Buffer.from(imageDataUri, 'base64');

    const imageStream = stream.Readable.from(imageBuffer);

    const { writeStream, uploadFinished } = writeStreamToS3('resize-images-demo', 'somekeyyyxx.png', 'image/png');

    const resizeStream = streamToSharp(400, 400);

    await promisify(stream.pipeline)(imageStream, resizeStream, writeStream);

    const data = await uploadFinished;
    console.log({ data });
  } catch (error) {
    console.log({ error });
  }
})();
