# Checkout single product with Video Processing
An [Express server](http://expressjs.com) implementation

## Requirements
* Node v10+
* [Configured .env file](../../README.md)

## How to run

1. Confirm `.env` configuration

This sample requires a Price ID in the `PRICE` environment variable.

Open `.env` and confirm `PRICE` is set equal to the ID of a Price from your
Stripe account. It should look something like:

```
PRICE=price_1Hh1ZeCZ6qsJgndJaX9fauRl
NOVITA_API_KEY=your_novita_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_bucket_name
```

Note that `price_12345` is a placeholder and the sample will not work with that
price ID. You can [create a price](https://stripe.com/docs/api/prices/create)
from the dashboard or with the Stripe CLI.

2. Set up Novita.ai API access

Make sure you have the Novita.ai API key in your .env file as NOVITA_API_KEY.
This integration uses the Novita.ai video-merge-face API to process videos.

3. Install dependencies

```
npm install
```

4. Run the application

```
npm start
```

5. If you're using the html client, go to `localhost:4242` to see the demo. For
   react, visit `localhost:3000`.

## API Endpoints

### POST /api/temp-upload
Temporarily uploads files to S3 and returns a tempId for later processing.

### POST /api/process-video
Processes video using tempId:
1. Uploads video to Novita assets API to get video_assets_id
2. Converts face image to base64
3. Sends to Novita.ai video-merge-face API
4. Returns task_id for WebSocket updates

### WebSocket Connection
Connect to ws://localhost:4243 to receive real-time updates on video processing.
