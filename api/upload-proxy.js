export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { uploadUrl, fileBase64, contentType } = await req.json();
    if (!uploadUrl || !fileBase64) return res.status(400).json({ error: 'missing fields' });

    const buffer = Buffer.from(fileBase64, 'base64');
    const yandexRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType || 'application/octet-stream' },
      body: buffer,
    });

    if (!yandexRes.ok) {
      const txt = await yandexRes.text();
      return res.status(yandexRes.status).json({ error: txt });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
