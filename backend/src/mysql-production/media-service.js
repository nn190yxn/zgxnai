const crypto = require('crypto');
const path = require('path');

const MIME_TYPES = Object.freeze({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'audio/mpeg': 'mp3', 'video/mp4': 'mp4' });
const MAX_BYTES = Object.freeze({ image: 10 * 1024 * 1024, audio: 30 * 1024 * 1024, video: 100 * 1024 * 1024 });

function validateMedia(input) {
  const filename = String(input && input.filename || '').trim();
  const mimeType = String(input && input.mimeType || '').toLowerCase();
  const buffer = input && input.buffer;
  if (!filename || filename !== path.basename(filename) || filename.includes('\0')) throw new Error('文件名不合法');
  if (!MIME_TYPES[mimeType]) throw new Error('媒体类型不受支持');
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('媒体内容为空');
  const mediaType = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('audio/') ? 'audio' : 'video';
  if (buffer.length > MAX_BYTES[mediaType]) throw new Error('媒体文件超过大小限制');
  return { filename, mimeType, mediaType, extension: MIME_TYPES[mimeType], size: buffer.length };
}

function buildStoredName(input) {
  const safe = validateMedia(input);
  return `${crypto.createHash('sha256').update(input.buffer).digest('hex').slice(0, 32)}.${safe.extension}`;
}

function createStorageAdapter({ root, cdnPrefix = '' }) {
  return {
    root,
    cdnPrefix: String(cdnPrefix || '').replace(/\/$/, ''),
    publicUrl(name) { return `${this.cdnPrefix}/uploads/media/${encodeURIComponent(name)}`; }
  };
}

module.exports = { MIME_TYPES, MAX_BYTES, validateMedia, buildStoredName, createStorageAdapter };
