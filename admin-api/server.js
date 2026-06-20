import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import multer from 'multer';
import AdmZip from 'adm-zip';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in admin-api/.env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const PREVIEWS_DIR = process.env.PREVIEWS_DIR || '/srv/www/manndev/client-previews';

function hasPreview(userId) {
  const dir = path.join(PREVIEWS_DIR, userId);
  return fs.existsSync(path.join(dir, 'index.html'));
}

// Only ever reached via nginx's auth_basic-gated /admin/api/ proxy — never expose this port publicly.
const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

app.post('/clients/:userId/preview', upload.single('zip'), (req, res) => {
  const { userId } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No zip file uploaded' });

  try {
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries().filter(entry => {
      const normalized = entry.entryName.replace(/\\/g, '/');
      return !normalized.startsWith('__MACOSX/') && !normalized.split('/').pop().startsWith('.');
    });

    for (const entry of entries) {
      const normalized = path.normalize(entry.entryName);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        throw new Error(`Unsafe path in zip: ${entry.entryName}`);
      }
    }

    // macOS zip tools often wrap contents in a single top-level folder — unwrap it
    // so index.html ends up at the preview root regardless of how the zip was made.
    const topLevelDirs = new Set(
      entries.map(e => e.entryName.replace(/\\/g, '/').split('/')[0]).filter(Boolean)
    );
    let stripPrefix = '';
    if (!entries.some(e => e.entryName.replace(/\\/g, '/') === 'index.html') && topLevelDirs.size === 1) {
      const onlyDir = [...topLevelDirs][0];
      if (entries.every(e => e.entryName.replace(/\\/g, '/').startsWith(onlyDir + '/'))) {
        stripPrefix = onlyDir + '/';
      }
    }

    const dir = path.join(PREVIEWS_DIR, userId);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const relPath = entry.entryName.replace(/\\/g, '/').slice(stripPrefix.length);
      if (!relPath) continue;
      const destPath = path.join(dir, relPath);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, entry.getData());
    }

    if (!fs.existsSync(path.join(dir, 'index.html'))) {
      throw new Error('Zip does not contain an index.html at its root (or in a single wrapping folder)');
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/clients/:userId/preview', (req, res) => {
  const { userId } = req.params;
  try {
    fs.rmSync(path.join(PREVIEWS_DIR, userId), { recursive: true, force: true });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/clients', async (req, res) => {
  try {
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (usersError) throw usersError;

    const { data: projects, error: projectsError } = await supabase
      .from('client_projects')
      .select('*');
    if (projectsError) throw projectsError;

    const projectByUserId = new Map(projects.map(p => [p.user_id, p]));

    const clients = users.users.map(u => {
      const p = projectByUserId.get(u.id) || null;
      return {
        user_id: u.id,
        email: u.email,
        created_at: u.created_at,
        business_name: p?.business_name ?? null,
        stage: p?.stage ?? null,
        launched_at: p?.launched_at ?? null,
        live_url: p?.live_url ?? null,
        last_updated_at: p?.last_updated_at ?? null,
        last_security_check_at: p?.last_security_check_at ?? null,
        has_project: !!p,
        has_preview: hasPreview(u.id),
      };
    });

    res.json({ clients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/clients/:userId', async (req, res) => {
  const { userId } = req.params;
  const { business_name, stage, launched_at, live_url, last_updated_at, last_security_check_at } = req.body;

  try {
    const { error } = await supabase
      .from('client_projects')
      .upsert({
        user_id: userId,
        business_name,
        stage,
        launched_at,
        live_url,
        last_updated_at,
        last_security_check_at,
      });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/clients/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { error } = await supabase.from('client_projects').delete().eq('user_id', userId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const port = PORT || 3001;
app.listen(port, '127.0.0.1', () => {
  console.log(`admin-api listening on 127.0.0.1:${port}`);
});
