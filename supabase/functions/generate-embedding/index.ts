import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Standard CORS headers for mobile/web requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { base64Image } = await req.json()

    if (!base64Image) {
      throw new Error('No image provided in the request.')
    }

    // 1. Call Google Gemini API to get the vector embedding
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${Deno.env.get('AI_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [{
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }]
        }
      })
    });

    const aiData = await aiResponse.json();
    
    if (aiData.error) {
      throw new Error(aiData.error.message);
    }

    // 2. Extract the actual vector array from Gemini's response format
    const embeddingArray = aiData.embedding.values; 

    // 3. Return the array back to the React Native app
    return new Response(
      JSON.stringify({ embedding: embeddingArray }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})