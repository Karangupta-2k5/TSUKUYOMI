import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Configuration & Database Service for Tsukuyomi Watch
 * Chapter V: Samurai Honours (Stargazer Authentication & Celestial Uploads)
 *
 * Tables:
 *  1. `stargazer_users`    — Authentication details, Clan Crest avatar, Honor XP, Rank, Stamps
 *  2. `celestial_uploads`  — Uploaded astrophotography images, EXIF checks, GPS, Spirit Lens flag, Reactions
 * Storage Bucket:
 *  - `celestial-uploads`   — Public bucket for uploaded astrophotography image files
 */

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
  'https://lcwsuzobacqzbutqwmvh.supabase.co';
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  'sb_publishable_Vd1NePWLZcggX8aJ1v0Xpg_-b5DIoKi';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith('http') &&
    !SUPABASE_URL.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ---------------------------------------------------------------------------
// Database Row Interfaces matching `supabase/schema.sql`
// ---------------------------------------------------------------------------

export interface StargazerUserRow {
  id: string;
  auth_user_id?: string | null;
  email: string;
  name: string;
  password_hash?: string | null;
  location: string;
  avatar: string;
  honor_xp: number;
  rank_title: string;
  stamps: string[];
  prefill_demo: boolean;
  registered_at: string;
  last_login_at: string;
  updated_at?: string;
}

export interface CelestialUploadRow {
  id: string;
  user_id?: string | null;
  user_email: string;
  author_name: string;
  author_avatar: string;
  item_id: string;
  item_name: string;
  category: string;
  observation_location: string;
  camera_make: string | null;
  camera_model: string | null;
  camera_gear: string | null;
  captured_at: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  image_url: string | null;
  storage_path: string | null;
  spirit_lens_enhanced: boolean;
  shared_to_sky: boolean;
  verification_passed: boolean;
  match_score: number;
  honor_awarded: number;
  artwork_seed: number;
  lantern_count: number;
  bow_count: number;
  exif_checks: { label: string; passed: boolean; detail: string }[];
  created_at: string;
}

const LOCAL_USERS_KEY = 'tsukuyomi_supabase_stargazer_users';
const LOCAL_UPLOADS_KEY = 'tsukuyomi_supabase_celestial_uploads';

export function computeRankTitle(honorXp: number): string {
  if (honorXp >= 7500) return 'Grand Astronomer';
  if (honorXp >= 3500) return 'Celestial Chronicler';
  if (honorXp >= 1500) return 'Constellation Keeper';
  if (honorXp >= 500) return 'Night Wanderer';
  return 'Star Seeker';
}

async function hashPassphrase(raw: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(`tsukuyomi_salt_${raw}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return btoa(raw);
  }
}

// ---------------------------------------------------------------------------
// Local Fallback Helpers (mirrors exact Supabase table columns when offline)
// ---------------------------------------------------------------------------

function getLocalUserRows(): StargazerUserRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUserRows(rows: StargazerUserRow[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(rows));
  } catch {
    // ignore quota errors
  }
}

function getLocalUploadRows(): CelestialUploadRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_UPLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUploadRows(rows: CelestialUploadRow[]): void {
  try {
    localStorage.setItem(LOCAL_UPLOADS_KEY, JSON.stringify(rows));
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// 1. Authentication & `stargazer_users` Table Operations
// ---------------------------------------------------------------------------

export async function registerStargazerInSupabase(params: {
  name: string;
  email: string;
  password: string;
  location: string;
  avatar: string;
  prefillDemo: boolean;
}): Promise<{ row: StargazerUserRow; source: 'supabase' | 'local-mirror' }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();
  const cleanLocation = params.location.trim() || 'Dark-Sky Sanctuary';
  const initialHonor = params.prefillDemo ? 750 : 150;
  const rankTitle = computeRankTitle(initialHonor);
  const stamps = params.prefillDemo
    ? ['Blood Moon Eclipse 2026', 'Perseid Watcher']
    : ['Perseid Watcher'];
  const passwordHash = await hashPassphrase(params.password);
  const nowIso = new Date().toISOString();

  if (supabase) {
    try {
      // 1. Optional Supabase Auth signUp (non-blocking if email confirmation is required)
      let authUserId: string | null = null;
      const { data: authData } = await supabase.auth.signUp({
        email: cleanEmail,
        password: params.password.length >= 6 ? params.password : `${params.password}_tsukuyomi`,
        options: {
          data: {
            name: cleanName,
            location: cleanLocation,
            avatar: params.avatar,
          },
        },
      });
      if (authData?.user?.id) {
        authUserId = authData.user.id;
      }

      // 2. Upsert into `public.stargazer_users` table
      const payload = {
        auth_user_id: authUserId,
        email: cleanEmail,
        name: cleanName,
        password_hash: passwordHash,
        location: cleanLocation,
        avatar: params.avatar,
        honor_xp: initialHonor,
        rank_title: rankTitle,
        stamps,
        prefill_demo: params.prefillDemo,
        last_login_at: nowIso,
        updated_at: nowIso,
      };

      const { data, error } = await supabase
        .from('stargazer_users')
        .upsert(payload, { onConflict: 'email' })
        .select('*')
        .single();

      if (!error && data) {
        const row = data as StargazerUserRow;
        const localRows = getLocalUserRows().filter((u) => u.email !== cleanEmail);
        saveLocalUserRows([row, ...localRows]);
        return { row, source: 'supabase' };
      }
    } catch {
      // Fallback to local mirror if network/table not migrated yet
    }
  }

  // Local mirror with identical `stargazer_users` columns
  const localRows = getLocalUserRows();
  const existing = localRows.find((u) => u.email === cleanEmail);
  const row: StargazerUserRow = {
    id: existing?.id || crypto.randomUUID?.() || 'sg_' + Math.random().toString(36).substring(2, 10),
    auth_user_id: null,
    email: cleanEmail,
    name: cleanName,
    password_hash: passwordHash,
    location: cleanLocation,
    avatar: params.avatar,
    honor_xp: initialHonor,
    rank_title: rankTitle,
    stamps,
    prefill_demo: params.prefillDemo,
    registered_at: existing?.registered_at || nowIso,
    last_login_at: nowIso,
    updated_at: nowIso,
  };

  saveLocalUserRows([row, ...localRows.filter((u) => u.email !== cleanEmail)]);
  return { row, source: 'local-mirror' };
}

export async function loginStargazerInSupabase(params: {
  email: string;
  password: string;
}): Promise<{ row: StargazerUserRow; source: 'supabase' | 'local-mirror' }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const passwordHash = await hashPassphrase(params.password);
  const nowIso = new Date().toISOString();

  if (supabase) {
    try {
      // Attempt Supabase Auth sign-in
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: params.password.length >= 6 ? params.password : `${params.password}_tsukuyomi`,
      });

      // Fetch user row from `public.stargazer_users`
      const { data: existingUser, error: selectErr } = await supabase
        .from('stargazer_users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!selectErr && existingUser) {
        if (
          existingUser.password_hash &&
          params.password &&
          existingUser.password_hash !== passwordHash
        ) {
          throw new Error('Invalid secret passphrase for this Stargazer account.');
        }

        const { data: updated } = await supabase
          .from('stargazer_users')
          .update({ last_login_at: nowIso, updated_at: nowIso })
          .eq('id', existingUser.id)
          .select('*')
          .single();

        const row = (updated || existingUser) as StargazerUserRow;
        const localRows = getLocalUserRows().filter((u) => u.email !== cleanEmail);
        saveLocalUserRows([row, ...localRows]);
        return { row, source: 'supabase' };
      }
    } catch (err: any) {
      if (err?.message?.includes('Invalid secret passphrase')) {
        throw err;
      }
    }
  }

  // Check local mirror table
  const localRows = getLocalUserRows();
  const found = localRows.find((u) => u.email === cleanEmail);
  if (found) {
    if (found.password_hash && params.password && found.password_hash !== passwordHash) {
      throw new Error('Invalid secret passphrase for this Stargazer account.');
    }
    const updatedRow: StargazerUserRow = {
      ...found,
      last_login_at: nowIso,
      updated_at: nowIso,
    };
    saveLocalUserRows([updatedRow, ...localRows.filter((u) => u.email !== cleanEmail)]);
    return { row: updatedRow, source: 'local-mirror' };
  }

  // Create default account on first login if not registered yet
  return registerStargazerInSupabase({
    name: cleanEmail.split('@')[0] || 'Samurai Stargazer',
    email: cleanEmail,
    password: params.password || 'tsukuyomi',
    location: 'Kyoto Sanctuary, JP',
    avatar: '🌙',
    prefillDemo: true,
  });
}

export async function updateStargazerHonorInSupabase(
  email: string,
  newHonorXp: number,
  newStamps?: string[]
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const rankTitle = computeRankTitle(newHonorXp);
  const nowIso = new Date().toISOString();

  if (supabase) {
    try {
      const updatePayload: Record<string, unknown> = {
        honor_xp: newHonorXp,
        rank_title: rankTitle,
        updated_at: nowIso,
      };
      if (newStamps) {
        updatePayload.stamps = newStamps;
      }
      await supabase.from('stargazer_users').update(updatePayload).eq('email', cleanEmail);
    } catch {
      // Ignore network errors and update local mirror below
    }
  }

  const localRows = getLocalUserRows();
  const updated = localRows.map((u) =>
    u.email === cleanEmail
      ? {
          ...u,
          honor_xp: newHonorXp,
          rank_title: rankTitle,
          stamps: newStamps ?? u.stamps,
          updated_at: nowIso,
        }
      : u
  );
  saveLocalUserRows(updated);
}

// ---------------------------------------------------------------------------
// 2. Image Upload & `celestial_uploads` Table Operations
// ---------------------------------------------------------------------------

export async function saveCelestialUploadToSupabase(params: {
  userId?: string | null;
  userEmail: string;
  authorName: string;
  authorAvatar: string;
  itemId: string;
  itemName: string;
  category: string;
  observationLocation: string;
  cameraMake: string;
  cameraModel: string;
  capturedAt: Date | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  imageDataUrl: string | null;
  rawFile?: File | null;
  spiritLensEnhanced: boolean;
  sharedToSky: boolean;
  verificationPassed: boolean;
  matchScore: number;
  honorAwarded: number;
  artworkSeed: number;
  exifChecks: { label: string; passed: boolean; detail: string }[];
}): Promise<{ row: CelestialUploadRow; source: 'supabase' | 'local-mirror' }> {
  const nowIso = new Date().toISOString();
  const cameraGear =
    [params.cameraMake, params.cameraModel].filter(Boolean).join(' ').trim() ||
    'Verified Astro Sensor';

  let publicImageUrl = params.imageDataUrl;
  let storagePath: string | null = null;

  if (supabase) {
    try {
      // 1. Upload image binary to Supabase Storage bucket `celestial-uploads` if a file is provided
      if (params.rawFile) {
        const safeName = params.rawFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        storagePath = `${params.userEmail.replace(/[^a-zA-Z0-9]/g, '_')}/${Date.now()}_${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from('celestial-uploads')
          .upload(storagePath, params.rawFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadErr) {
          const { data: pubUrl } = supabase.storage
            .from('celestial-uploads')
            .getPublicUrl(storagePath);
          if (pubUrl?.publicUrl) {
            publicImageUrl = pubUrl.publicUrl;
          }
        }
      }

      // 2. Insert structured row into `public.celestial_uploads`
      const isValidUuid =
        params.userId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId);

      const insertPayload = {
        user_id: isValidUuid ? params.userId : null,
        user_email: params.userEmail.toLowerCase(),
        author_name: params.authorName,
        author_avatar: params.authorAvatar,
        item_id: params.itemId,
        item_name: params.itemName,
        category: params.category,
        observation_location: params.observationLocation,
        camera_make: params.cameraMake || null,
        camera_model: params.cameraModel || null,
        camera_gear: cameraGear,
        captured_at: params.capturedAt ? params.capturedAt.toISOString() : null,
        gps_latitude: params.gpsLatitude,
        gps_longitude: params.gpsLongitude,
        image_url: publicImageUrl,
        storage_path: storagePath,
        spirit_lens_enhanced: params.spiritLensEnhanced,
        shared_to_sky: params.sharedToSky,
        verification_passed: params.verificationPassed,
        match_score: params.matchScore,
        honor_awarded: params.honorAwarded,
        artwork_seed: params.artworkSeed,
        lantern_count: 1,
        bow_count: 1,
        exif_checks: params.exifChecks,
      };

      const { data, error } = await supabase
        .from('celestial_uploads')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!error && data) {
        const row = data as CelestialUploadRow;
        const localUploads = getLocalUploadRows();
        saveLocalUploadRows([row, ...localUploads]);
        return { row, source: 'supabase' };
      }
    } catch {
      // Fallback to local mirror if offline or table not created yet
    }
  }

  const fallbackRow: CelestialUploadRow = {
    id: crypto.randomUUID?.() || 'up_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    user_id: params.userId || null,
    user_email: params.userEmail.toLowerCase(),
    author_name: params.authorName,
    author_avatar: params.authorAvatar,
    item_id: params.itemId,
    item_name: params.itemName,
    category: params.category,
    observation_location: params.observationLocation,
    camera_make: params.cameraMake || null,
    camera_model: params.cameraModel || null,
    camera_gear: cameraGear,
    captured_at: params.capturedAt ? params.capturedAt.toISOString() : null,
    gps_latitude: params.gpsLatitude,
    gps_longitude: params.gpsLongitude,
    image_url: publicImageUrl,
    storage_path: storagePath,
    spirit_lens_enhanced: params.spiritLensEnhanced,
    shared_to_sky: params.sharedToSky,
    verification_passed: params.verificationPassed,
    match_score: params.matchScore,
    honor_awarded: params.honorAwarded,
    artwork_seed: params.artworkSeed,
    lantern_count: 1,
    bow_count: 1,
    exif_checks: params.exifChecks,
    created_at: nowIso,
  };

  const localUploads = getLocalUploadRows();
  saveLocalUploadRows([fallbackRow, ...localUploads]);
  return { row: fallbackRow, source: 'local-mirror' };
}

export async function fetchCelestialUploadsFromSupabase(
  userEmail?: string
): Promise<{
  userUploads: CelestialUploadRow[];
  sharedUploads: CelestialUploadRow[];
  allUsers: StargazerUserRow[];
  source: 'supabase' | 'local-mirror';
}> {
  if (supabase) {
    try {
      const [uploadsRes, usersRes] = await Promise.all([
        supabase
          .from('celestial_uploads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('stargazer_users')
          .select('*')
          .order('honor_xp', { ascending: false })
          .limit(50),
      ]);

      if (!uploadsRes.error && uploadsRes.data) {
        const allUploads = uploadsRes.data as CelestialUploadRow[];
        const cleanEmail = userEmail?.trim().toLowerCase();
        return {
          userUploads: cleanEmail
            ? allUploads.filter((u) => u.user_email.toLowerCase() === cleanEmail)
            : allUploads,
          sharedUploads: allUploads.filter((u) => u.shared_to_sky),
          allUsers: (usersRes.data as StargazerUserRow[]) || getLocalUserRows(),
          source: 'supabase',
        };
      }
    } catch {
      // Fallback to local mirror
    }
  }

  const localUploads = getLocalUploadRows();
  const localUsers = getLocalUserRows();
  const cleanEmail = userEmail?.trim().toLowerCase();

  return {
    userUploads: cleanEmail
      ? localUploads.filter((u) => u.user_email.toLowerCase() === cleanEmail)
      : localUploads,
    sharedUploads: localUploads.filter((u) => u.shared_to_sky),
    allUsers: localUsers,
    source: 'local-mirror',
  };
}
