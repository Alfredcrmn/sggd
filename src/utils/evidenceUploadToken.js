import { supabase } from "../supabase/client";

const getTokenPayload = (data) => {
  const payload = Array.isArray(data) ? data[0] : data;
  const token = payload?.token || payload?.token?.token || null;
  const objectPrefix = payload?.object_prefix || payload?.objectPrefix || payload?.object_prefix?.object_prefix || null;
  const expiresAt = payload?.expires_at || payload?.expiresAt || payload?.expires_at?.expires_at || null;

  if (!token || !objectPrefix) {
    throw new Error("Respuesta inválida al generar el token de carga.");
  }

  return { token, objectPrefix, expiresAt };
};

const canUsePublicFallback = (error) => {
  const message = (error?.message || "").toLowerCase();

  if (message.includes("no autorizado")) {
    return false;
  }

  return (
    message.includes("authentication required") ||
    message.includes("jwt") ||
    message.includes("permission denied")
  );
};

const requestToken = async (functionName, params) => {
  const { data, error } = await supabase.rpc(functionName, params);
  if (error) throw error;
  return getTokenPayload(data);
};

export const getEvidenceUploadToken = async ({ table, recordId, sessionId, ttlSeconds = 900 }) => {
  const params = {
    p_table: table,
    p_record_id: String(recordId),
    p_session_id: sessionId,
    p_ttl_seconds: ttlSeconds
  };

  try {
    return await requestToken("generate_evidencia_upload_token", params);
  } catch (error) {
    if (!canUsePublicFallback(error)) {
      throw error;
    }

    return requestToken("generate_public_evidencia_upload_token", params);
  }
};
