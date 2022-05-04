import fs from 'fs';
import sharp from 'sharp';
import axios from 'axios';
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

const imageUrl = 'https://ipfs.io/ipfs/QmRbi9VjSyf3aX7nHc7hF17DfcxYfDxsxfAnzkTVF6DDdS/Random%20Akutar%20Airdrop%20Pass.gif';

(async () => {
  console.time('test');
  try {
    // const { data: imageStream } = await axios.get(imageUrl, { responseType: 'stream' });

    const imageStream = fs.createReadStream('./Random Akutar Airdrop Pass.gif');

    const contentType = 'image/gif';

    const { writeStream, uploadFinished } = writeStreamToS3('resize-images-demo', 'somekeyyyxx', contentType);

    const resizeStream = streamToSharp(400, 400);

    await promisify(stream.pipeline)(imageStream, resizeStream, writeStream);

    const data = await uploadFinished;
    console.log({ data });
    console.timeEnd('test');
  } catch (error) {
    console.log({ error });
  }
})();
