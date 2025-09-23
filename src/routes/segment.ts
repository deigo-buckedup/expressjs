import express from 'express';
import multer from 'multer';
import { config } from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
if (process.env.NODE_ENV !== 'production') {
  config();
}

const segment = express.Router();
const upload = multer({ dest: '/tmp' });

segment.post('/generate', <any>upload.single('audio'), async (req, res) => {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_KEY
    });

    const targetPath = req.file.path + '.mp3';
    await fs.promises.rename(req.file.path, targetPath);

    const segmentsResponse = await client.audio.transcriptions.create({
      file: fs.createReadStream(targetPath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    });

    const segments = segmentsResponse.segments.map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text
    }));
    await fs.promises.unlink(targetPath);
    const decoupageResponse = await client.responses.create({
      model: 'gpt-5-mini',
      instructions:
        'You will receive a JSON array of objects, where each object represents a transcript segment from a video with the following keys: "start": the start timecode (in seconds) of the segment, "end": the end timecode (in seconds) of the segment, "text": the transcript text from that time period. Your task is to analyze all segments as a whole and identify the distinct portions of the video that correspond to the most relevant marketing functions, using only the tags from the following list: HOOK, CONTENT, CTA, SOCIALPROOF, PRODUCTDEMO, BENEFIT, FEATURELIST, URGENCY, TESTIMONIAL, PATTERNINTERRUPT, BROLL, OPENER, CLOSER For each portion you identify, return an object with these keys: "start": start time (can overlap or span multiple segments; pick the most appropriate start time from the input) "end": end time (same logic as start) "key": the single most relevant marketing tag from the list above for this portion "transcript": the full transcript text covered by this portion (combine the "text" fields from all relevant segments) Return a JSON array of these objects covering the relevant stretches of the video, based on your interpretation of the transcript, not simply copying the original segment boundaries. Important: Ensure that each portion you identify begins and ends at logical, natural sentence boundaries—you should not start a portion mid-sentence from a previous portion, nor end a portion abruptly without completing the current sentence. Only include full, complete sentences at the boundaries of each portion. Timecodes should be mapped as accurately as possible using the input segment boundaries. Use only one marketing tag per object, picking the MOST RELEVANT TAG from the provided list. Combine the transcript text from the relevant segments and include it in the "transcript" field for each output object. Only return the final JSON array as output.',
      input: JSON.stringify(segments)
    });

    res.status(200).json({ data: JSON.parse(decoupageResponse.output_text) });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'generation_failed', msg: e.message });
  }
});

export default segment;
