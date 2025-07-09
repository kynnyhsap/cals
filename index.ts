import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: Bun.env.OPENAI_API_KEY,
});

const schema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),

  breakdown: z.array(
    z.object({
      food: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
  ),
});

const systemPrompt = `
Given a list of foods, calculate and return the total calories. Ignore any other text that is not a list of foods.
Return only a JSON object with the total calories and macros (protein, carbs, fat) in the following format:

{
  "calories": 100,
  "protein": 10,
  "carbs": 10,
  "fat": 10,
  "breakdown": [
    {
      "food": "food name",
      "calories": 100,
      "protein": 10,
      "carbs": 10,
      "fat": 10
    }
  ]
}

`;

async function analyzeFoods(text: string) {
  const response = await openai.chat.completions.parse({
    model: "o4-mini",
    response_format: zodResponseFormat(schema, "result"),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
  });

  return response?.choices[0]?.message?.parsed ?? null;
}

const port = Bun.env.PORT ?? 3000;

Bun.serve({
  port,

  routes: {
    "/": {
      async GET() {
        return Response.json({ message: "sup dawg" });
      },

      async POST(req) {
        try {
          const { text } = (await req.json()) as { text: string };

          if (!text) {
            return Response.json(
              { error: "no text field gang" },
              { status: 400 }
            );
          }

          console.log({ text });

          const result = await analyzeFoods(text);

          if (!result) {
            return Response.json(
              { error: "no result from openai" },
              { status: 500 }
            );
          }

          console.log({ result });

          return Response.json(result);
        } catch (error) {
          return Response.json(
            { error: "openai is tripping bro, somethign went woring:" + error },
            { status: 500 }
          );
        }
      },
    },
  },
});
