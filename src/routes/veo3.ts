import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  config();
}

const veo3 = express.Router();
const upload = multer();

veo3.post('/generate', <any>upload.single('image'), async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.apiKey });

    const generateVideosReq: any = { prompt: req.body.prompt, config: {} };
    if (req.file) {
      const imageBytes = req.file.buffer.toString('base64');
      generateVideosReq.image = {
        imageBytes,
        mimeType: req.file.mimetype
      };
    }

    ['aspectRatio', 'resolution', 'negativePrompt'].forEach((key) => {
      if (req.body[key]) generateVideosReq.config[key] = req.body[key];
    });

    console.log(`Request: ${JSON.stringify(generateVideosReq)}`);

    let operation = await ai.models.generateVideos({
      model: 'veo-3.0-generate-001',
      ...generateVideosReq
    });

    while (!operation.done) {
      console.log('Waiting for video generation to complete...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({
        operation: operation
      });
    }

    const response = await fetch(
      operation.response.generatedVideos[0].video?.uri,
      { headers: { 'x-goog-api-key': process.env.apiKey } }
    );
    const arrayBuffer = await response.arrayBuffer();
    res.type('mp4').send(Buffer.from(arrayBuffer));
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'generation_failed', msg: e.message });
  }
});

export default veo3;
