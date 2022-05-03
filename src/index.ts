import axios from 'axios';
import fs from 'fs';
import sharp from 'sharp';
import AWS from 'aws-sdk';
import stream from 'stream';
import parseDataUrl from 'parse-data-url';
import { getMimeType } from 'stream-mime-type';
import got from 'got';
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

const images = [
  // 'https://ipfs.io/ipfs/QmYV2Nr63RHAkxypYSeoigQE3F7y3SKPmVB1R8QzBPgDZS',
  // 'https://ipfs.io/ipfs/QmXom8NNfWcetdGXpZWded89ZnxYY1kEfod3MXfovoeQbg',
  // 'https://ab-inbev.mypinata.cloud/ipfs/QmUcHTsGQ4QhaJaR954K4XAvN5RRUaZWzCNNDpJmXsqsF6',
  // 'https://ipfs.io/ipfs/Qmb4VB12RsXW6DaKranEdgnMUTzfyVBEb5eZ1v7JCEUxL1/',
  // 'https://azuki-airdrop.s3.amazonaws.com/bean_pod.gif',
  // 'https://c.tenor.com/uEjQxCwAWfgAAAAC/sample.gif',
  'https://gateway.pinata.cloud/ipfs/Qmekf6Xb9cisNgVeCzBN7VYPC1DQFazAw2wxC5dPiYdaJt',
  // 'https://ipfs.io/ipfs/Qmb4VB12RsXW6DaKranEdgnMUTzfyVBEb5eZ1v7JCEUxL1/',
  // 'https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/AJ_Digital_Camera.svg',
];

(async () => {
  // const { data: imageStream } = await axios.get('https://cryptobullsociety.com/images/6.png', { responseType: 'stream' });
  // const { data: imageStream } = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  // const imageDataUri = fs.readFileSync('./svg.txt', { encoding: 'utf8' })
  //   .replace(/^data:image\/[\w+]+;base64,/, '');

  // const imageBuffer = Buffer.from(imageDataUri, 'base64');

  // const imageStream = stream.Readable.from(imageBuffer);

  // const { mime, stream: newStream } = await getMimeType(imageStream);
  // console.log({ mime });

  // console.log(imageStream);
  // const image = sharp(imageStream);
  // console.log(await image.metadata());

  // const { writeStream, uploadFinished } =
  // writeStreamToS3('resize-images-demo', 'somekeyyyxx.png');

  // const resizeStream = streamToSharp(400, 400);

  // stream.pipeline(imageStream, resizeStream, writeStream, (error) => {
  //   if (error) {
  //     console.log({ error });
  //   }
  // });

  // const streamm = fs.createReadStream('./gemy.svg');
  // console.log(await getMimeType(streamm));

  // imageStream.pipe(writeStream);

  // const data = await uploadFinished;
  // console.log({ data });

  // const data = fs.readFileSync('./image.txt', { encoding: 'utf-8' });

  // const encodedData = data.match(/^data:(image\/[\w+]+);base64,(.*)/);

  // console.log(encodedData[2]);

  // if (await isS3FileExists('resize-images-demo', `${nft.token_address}-${nft.token_id}`)) {
  //   return `https://resize-images-demo.s3.eu-central-1.amazonaws.com/${`${nft.token_address}-${nft.token_id}`}`;
  // }

  const image = 'https://gateway.pinata.cloud/ipfs/Qmekf6Xb9cisNgVeCzBN7VYPC1DQFazAw2wxC5dPiYdaJt';

  let imageStream: stream.Readable = null;
  let mimeType: string = null;

  // normal url
  try {
    const [{ headers }, response] = await Promise.all([
      axios.head(encodeURI(image), { timeout: 10000 }),
      axios.get(encodeURI(image), { responseType: 'stream', timeout: 10000 }),
    ]);

    mimeType = headers['content-type'];

    if (!mimeType) return image;
    if (!mimeType.startsWith('image')) return image;

    imageStream = response.data;
  } catch (error) {
    console.log({ error: error.message, image, mimeType });
    return null;
  }

  const { writeStream, uploadFinished } = writeStreamToS3('resize-images-demo', 'somekey', mimeType);

  const resizeStream = streamToSharp(400, 400);

  try {
    await promisify(stream.pipeline)(imageStream, resizeStream, writeStream);
    const data = await uploadFinished;

    console.log({ data });

    return data.Location;
  } catch (error) {
    console.log({
      error: 'pipeline error', message: error.message, image, mimeType,
    });
    return image;
  }
})();
