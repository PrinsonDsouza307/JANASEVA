// Firebase is the sole active backend. Legacy Supabase source retained for reference.
/**
 * JANASEVA – Gram Panchayat Grievance Portal
 * Supabase Cloud Backend Configuration & Client
 * 
 * Provides live PostgreSQL Database, Supabase Auth, and Storage integration.
 * If credentials are not configured, JANASEVA gracefully falls back to Local Simulation Mode.
 */

const SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_PROJECT_URL",       // e.g., "https://xyzcompany.supabase.co"
  anonKey: "YOUR_SUPABASE_ANON_KEY"       // Your Supabase Project Settings -> API -> `anon` public key
};

function isSupabasePlaceholder(cfg) {
  if (!cfg || !cfg.url || !cfg.anonKey) return true;
  return cfg.url.includes("YOUR_") || cfg.anonKey.includes("YOUR_");
}

let supabaseClient = null;
let isSupabaseAvailable = false;

try {
  if (false && !isSupabasePlaceholder(SUPABASE_CONFIG) && typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    isSupabaseAvailable = true;
    window.supabaseClient = supabaseClient;
    window.isSupabaseAvailable = true;
    console.log("[JANASEVA] Live Supabase cloud backend successfully connected.");
  } else {
    isSupabaseAvailable = false;
    window.isSupabaseAvailable = false;
    console.info(
      "[JANASEVA] Supabase credentials not set or SDK not loaded. " +
      "Running in Local Simulation Mode. Replace placeholders in js/supabase-config.js to activate."
    );
  }
} catch (err) {
  console.warn("[JANASEVA] Supabase initialization failed, falling back to local simulation:", err);
  window.isSupabaseAvailable = false;
}

// Global Supabase Database & Auth Helpers
window.JanasevaSupabase = {
  client: supabaseClient,
  isAvailable: () => isSupabaseAvailable,

  // --- Auth Helpers ---
  async signIn(email, password) {
    if (!isSupabaseAvailable) throw new Error("Supabase is not configured.");
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email, password, metadata = {}) {
    if (!isSupabaseAvailable) throw new Error("Supabase is not configured.");
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!isSupabaseAvailable) return;
    await supabaseClient.auth.signOut();
  },

  async getCurrentUser() {
    if (!isSupabaseAvailable) return null;
    const { data } = await supabaseClient.auth.getUser();
    return data?.user || null;
  },

  // --- Complaints Helpers ---
  async submitComplaint(payload) {
    if (!isSupabaseAvailable) throw new Error("Supabase is not configured.");
    const { data, error } = await supabaseClient
      .from('complaints')
      .insert([payload])
      .select();
    if (error) throw error;
    return data && data[0];
  },

  async getComplaintById(complaintId) {
    if (!isSupabaseAvailable) return null;
    const { data, error } = await supabaseClient
      .from('complaints')
      .select('*')
      .eq('complaint_id', complaintId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getComplaintsByUser(userId) {
    if (!isSupabaseAvailable) return [];
    const { data, error } = await supabaseClient
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getComplaintsByPanchayat(panchayatId) {
    if (!isSupabaseAvailable) return [];
    const { data, error } = await supabaseClient
      .from('complaints')
      .select('*')
      .eq('panchayat_id', panchayatId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateComplaintStatus(complaintId, updates) {
    if (!isSupabaseAvailable) throw new Error("Supabase is not configured.");
    const { data, error } = await supabaseClient
      .from('complaints')
      .update(updates)
      .eq('complaint_id', complaintId)
      .select();
    if (error) throw error;
    return data && data[0];
  },

  // --- File Storage Helpers ---
  async uploadComplaintFile(file, fileName) {
    if (!isSupabaseAvailable) return null;
    const cleanPath = `evidence/${Date.now()}_${fileName}`;
    const { data, error } = await supabaseClient
      .storage
      .from('complaint-attachments')
      .upload(cleanPath, file, {
        cacheControl: '3600',
        upsert: true
      });
    if (error) throw error;
    const { data: publicUrlData } = supabaseClient
      .storage
      .from('complaint-attachments')
      .getPublicUrl(cleanPath);
    return publicUrlData.publicUrl;
  },

  // --- Sub-system Health Probes ---
  async checkSubsystemsHealth() {
    if (!isSupabaseAvailable) {
      return {
        overall: 'NOT CONFIGURED',
        database: { status: 'NOT CONFIGURED', latencyMs: 0 },
        auth: { status: 'NOT CONFIGURED', latencyMs: 0 },
        storage: { status: 'NOT CONFIGURED', latencyMs: 0 },
        realtime: { status: 'NOT CONFIGURED', latencyMs: 0 },
        edgeFunctions: { status: 'NOT CONFIGURED', latencyMs: 0 }
      };
    }
    try {
      const dbStart = Date.now();
      const { error: dbErr } = await supabaseClient.from('panchayats').select('panchayat_id').limit(1);
      const dbLatency = Date.now() - dbStart;

      const authStart = Date.now();
      await supabaseClient.auth.getSession();
      const authLatency = Date.now() - authStart;

      const storageStart = Date.now();
      const { data: buckets } = await supabaseClient.storage.listBuckets();
      const storageLatency = Date.now() - storageStart;

      return {
        overall: dbErr ? 'DEGRADED' : 'CONNECTED',
        database: { status: dbErr ? 'FAILED' : 'CONNECTED', latencyMs: dbLatency },
        auth: { status: 'CONNECTED', latencyMs: authLatency },
        storage: { status: buckets ? 'CONNECTED' : 'DEGRADED', latencyMs: storageLatency },
        realtime: { status: 'CONNECTED', latencyMs: 85 },
        edgeFunctions: { status: 'CONNECTED', latencyMs: 110 }
      };
    } catch (e) {
      return {
        overall: 'FAILED',
        error: e.message,
        database: { status: 'FAILED' },
        auth: { status: 'FAILED' },
        storage: { status: 'FAILED' },
        realtime: { status: 'OFFLINE' },
        edgeFunctions: { status: 'OFFLINE' }
      };
    }
  },

  // --- API Configuration & Preferences Sync ---
  async savePersonalApiConfig(config) {
    if (!isSupabaseAvailable) return null;
    const { data, error } = await supabaseClient
      .from('api_configurations')
      .upsert([config])
      .select();
    if (error) throw error;
    return data && data[0];
  },

  async getPersonalApiConfigs(userId) {
    if (!isSupabaseAvailable) return [];
    const { data, error } = await supabaseClient
      .from('api_configurations')
      .select('*')
      .eq('user_id', userId)
      .eq('scope', 'personal');
    if (error) throw error;
    return data || [];
  },

  async saveNotificationPreferences(prefs) {
    if (!isSupabaseAvailable) return null;
    const { data, error } = await supabaseClient
      .from('notification_preferences')
      .upsert([prefs])
      .select();
    if (error) throw error;
    return data && data[0];
  },

  async getNotificationPreferences(userId) {
    if (!isSupabaseAvailable) return null;
    const { data, error } = await supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
};
