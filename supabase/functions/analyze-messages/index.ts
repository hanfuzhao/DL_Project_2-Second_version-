import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SAFETYPE_API = "https://dl-project-2-second-version.onrender.com/api/predict";

const SEVERITY_MAP: Record<string, string> = {
  racism: "high",
  threat: "high",
  hate_speech: "high",
  sexism: "high",
  cyberbullying: "high",
  toxicity: "medium",
  profanity: "medium",
  implicit_hate: "medium",
  sarcasm: "low",
  clean: "none",
};

interface Message {
  id: number;
  text: string;
  sender: string | null;
  app_source: string;
  direction: string;
  source_layer: string;
}

async function analyzeText(text: string): Promise<{
  label: string;
  confidence: number;
  is_flagged: boolean;
  severity: string;
}> {
  const resp = await fetch(SAFETYPE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, model: "distilbert" }),
  });

  if (!resp.ok) {
    throw new Error(`SafeType API error (${resp.status})`);
  }

  const data = await resp.json();
  const label = data.label || "clean";
  const confidence = data.confidence || 0;

  return {
    label,
    confidence,
    is_flagged: label !== "clean",
    severity: SEVERITY_MAP[label] || "low",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let messageIds: number[] | null = null;
    try {
      const body = await req.json();
      if (body.message_ids && Array.isArray(body.message_ids)) {
        messageIds = body.message_ids;
      }
    } catch {
      // No body or invalid JSON — analyze all unanalyzed messages
    }

    let query = supabase
      .from("messages")
      .select("id, text, sender, app_source, direction, source_layer")
      .is("is_flagged", null)
      .order("timestamp", { ascending: false })
      .limit(25);

    if (messageIds) {
      query = supabase
        .from("messages")
        .select("id, text, sender, app_source, direction, source_layer")
        .in("id", messageIds)
        .limit(25);
    }

    const { data: messages, error: fetchError } = await query;
    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ status: "ok", analyzed: 0, flagged: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let flaggedCount = 0;
    let analyzedCount = 0;

    for (const msg of messages as Message[]) {
      try {
        const result = await analyzeText(msg.text);
        analyzedCount++;

        const flagReason = result.is_flagged
          ? `${result.label} (${(result.confidence * 100).toFixed(1)}% confidence)`
          : null;

        const { error: updateError } = await supabase
          .from("messages")
          .update({
            is_flagged: result.is_flagged,
            flag_reason: flagReason,
          })
          .eq("id", msg.id);

        if (updateError) {
          console.error(`Failed to update message ${msg.id}:`, updateError);
        }

        if (result.is_flagged) flaggedCount++;
      } catch (err) {
        console.error(`Failed to analyze message ${msg.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        analyzed: analyzedCount,
        flagged: flaggedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Analysis error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
