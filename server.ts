import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Server-Side Gemini AI Endpoint for Admin Product Auto-Generation
  app.post('/api/ai/generate-product', async (req, res) => {
    try {
      const rawQuery = req.body?.query || req.body?.prompt;
      const query = typeof rawQuery === 'string' ? rawQuery : '';
      if (!query.trim()) {
        res.status(400).json({ error: 'Product query is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured on server; using exact input parser.',
          fallback: true,
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate complete electronics product details for the Tech Sokoni store from this exact user input:
"${query.trim()}"

STRICT FIDELITY RULES:
1. You MUST preserve EVERY exact detail written by the user (exact product name/model, exact RAM, exact Storage, exact Processor, exact Screen Size, exact Color, exact GPU, exact OS, exact price if mentioned).
2. NEVER replace or contradict any specification written by the user. For example, if the user wrote "HP EliteBook 840 G8 Core i5 16GB RAM 512GB SSD 14 inch Silver", then name MUST include "HP EliteBook 840 G8", processor MUST be "Intel Core i5", ram MUST be "16GB", storage MUST be "512GB SSD", screenSize MUST be "14\"", and color MUST be "Silver".
3. Only infer or complete fields that the user did NOT explicitly specify, using accurate real-world specifications for that exact device.
4. Generate realistic product variations (such as Storage options, RAM options, Color options, Screen Size options) relevant to this product.`,
        config: {
          systemInstruction:
            'You are the Hardware Catalog Engine for TECH SOKONI. Always honor and copy the user’s exact written features and specifications verbatim into the corresponding fields before filling in any remaining blanks.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description:
                  'Exact product title incorporating the user input model and key identity',
              },
              sku: {
                type: Type.STRING,
                description:
                  'Unique SKU starting with TS- followed by category and model code',
              },
              brand: {
                type: Type.STRING,
                description: 'Exact manufacturer brand name',
              },
              category: {
                type: Type.STRING,
                description:
                  'One of: laptops, phones, desktops, monitors, printers, tablets, accessories, networking, storage, gaming',
              },
              price: {
                type: Type.NUMBER,
                description: 'Exact price if provided by user, or realistic USD price',
              },
              shortSpec: {
                type: Type.STRING,
                description:
                  'Key configuration line separated by middle dots (·) using the exact user-specified processor, RAM, storage, screen size, and color',
              },
              shortDescription: {
                type: Type.STRING,
                description:
                  '1-2 sentence summary accurately reflecting the exact specifications provided by the user',
              },
              description: {
                type: Type.STRING,
                description:
                  'Detailed 2-3 sentence technical overview faithful to the user input',
              },
              processor: {
                type: Type.STRING,
                description: 'Exact processor / chip specified by user or authentic model CPU',
              },
              ram: {
                type: Type.STRING,
                description: 'Exact RAM specified by user (e.g. 16GB DDR4 / 32GB Unified)',
              },
              storage: {
                type: Type.STRING,
                description: 'Exact storage specified by user (e.g. 512GB NVMe SSD)',
              },
              screenSize: {
                type: Type.STRING,
                description: 'Exact screen size specified by user (e.g. 14.0" FHD / 15.6")',
              },
              color: {
                type: Type.STRING,
                description: 'Exact color/finish specified by user',
              },
              os: {
                type: Type.STRING,
                description: 'Exact operating system specified by user or authentic OS',
              },
              graphics: {
                type: Type.STRING,
                description: 'Exact GPU / graphics specification',
              },
              ports: {
                type: Type.STRING,
                description: 'Connectivity and I/O ports',
              },
              battery: {
                type: Type.STRING,
                description: 'Battery specification',
              },
              weight: {
                type: Type.STRING,
                description: 'Weight in kg or g',
              },
              warranty: {
                type: Type.STRING,
                description: 'Warranty coverage statement',
              },
              variations: {
                type: Type.ARRAY,
                description:
                  'Product variation groups such as Storage, RAM, Color, Screen Size',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: 'Variation group name (e.g. Storage, RAM, Color, Screen Size)',
                    },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          priceDelta: { type: Type.NUMBER },
                        },
                        required: ['label', 'priceDelta'],
                      },
                    },
                  },
                  required: ['name', 'options'],
                },
              },
            },
            required: [
              'name',
              'sku',
              'brand',
              'category',
              'price',
              'shortSpec',
              'shortDescription',
              'description',
              'processor',
              'ram',
              'storage',
              'screenSize',
              'color',
              'os',
              'warranty',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini model');
      }

      const parsed = JSON.parse(text.trim());
      res.json(parsed);
    } catch (error: any) {
      console.error('Gemini product generation error:', error?.message || error);
      res.status(500).json({
        error: error?.message || 'Failed to generate product specifications',
        fallback: true,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tech Sokoni server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
