import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  config();
}

const banana = express.Router();
const upload = multer();

banana.post('/generate', <any>upload.array('images', 5), async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.apiKey });

    let prompt: any = '';

    if (req.files && Number(req.files.length) > 0) {
      prompt = [];
      prompt.push({ text: req.body.prompt });
      (req.files as Express.Multer.File[]).forEach((file) => {
        prompt.push({
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString('base64')
          }
        });
      });
    } else {
      prompt = req.body.prompt;
    }

    console.log(`Request: ${JSON.stringify(req.body.prompt)}`);
    console.log('Waiting for image generation to complete...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: prompt
    });

    const images: any = [];

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        images.push(imageData);
      }
    }

    if (images.length === 0)
      throw new Error('No images found in the response.');

    res
      .status(200)
      .json({
        images: images.map((image) => `data:image/png;base64,${image}`)
      });
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'generation_failed', msg: e.message });
  }
});

export default banana;
