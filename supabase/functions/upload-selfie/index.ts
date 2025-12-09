import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received upload request");
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionToken = formData.get("sessionToken") as string;

    console.log("File received:", file?.name, "Size:", file?.size, "Type:", file?.type);
    console.log("Session token:", sessionToken ? "present" : "missing");

    if (!file || !sessionToken) {
      return new Response(
        JSON.stringify({ error: "File and sessionToken are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("selfie_upload_sessions")
      .select("*")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session) {
      console.error("Session error:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Session already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Session expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read file as ArrayBuffer and convert properly
    const fileBuffer = await file.arrayBuffer();
    console.log("File buffer size:", fileBuffer.byteLength);
    
    if (fileBuffer.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: "Empty file received" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate file name with proper extension
    const fileExtension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${session.user_id}/selfie/${Date.now()}.${fileExtension}`;
    
    console.log("Uploading to:", fileName);

    // Upload file using admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("user-documents")
      .upload(fileName, fileBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Upload successful:", uploadData);

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("user-documents")
      .getPublicUrl(fileName);

    console.log("Public URL:", urlData.publicUrl);

    // Update session
    const { error: updateSessionError } = await supabaseAdmin
      .from("selfie_upload_sessions")
      .update({
        selfie_url: urlData.publicUrl,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("session_token", sessionToken);

    if (updateSessionError) {
      console.error("Session update error:", updateSessionError);
      return new Response(
        JSON.stringify({ error: "Failed to update session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also save to selfie_verifications table
    const { error: selfieError } = await supabaseAdmin
      .from("selfie_verifications")
      .upsert({
        user_id: session.user_id,
        selfie_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (selfieError) {
      console.error("Selfie verification save error:", selfieError);
      // Don't fail the request, just log
    }

    console.log("Upload complete!");

    return new Response(
      JSON.stringify({ success: true, selfieUrl: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
