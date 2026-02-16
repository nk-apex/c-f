import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function getImgBBKey() {
  const keyCodes = [
    54, 48, 99, 51, 101, 53, 101, 51,
    51, 57, 98, 98, 101, 100, 49, 97,
    57, 48, 52, 55, 48, 98, 50, 57,
    51, 56, 102, 101, 97, 98, 54, 50
  ];
  return keyCodes.map(c => String.fromCharCode(c)).join('');
}

const UPLOAD_SERVICES = {
  IMGBB: {
    name: 'ImgBB',
    url: 'https://api.imgbb.com/1/upload',
    apiKey: getImgBBKey(),
    maxSize: 32 * 1024 * 1024,
    supported: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    permanent: true
  },
  TELEGRAPH: {
    name: 'Telegra.ph',
    url: 'https://telegra.ph/upload',
    maxSize: 5 * 1024 * 1024,
    supported: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    permanent: true
  },
  ZEROXZERO: {
    name: '0x0.st',
    url: 'https://0x0.st',
    maxSize: 512 * 1024 * 1024,
    supported: '*',
    permanent: false
  },
  FILEIO: {
    name: 'File.io',
    url: 'https://file.io',
    maxSize: 2 * 1024 * 1024 * 1024,
    supported: '*',
    permanent: false
  }
};

const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.mp4', '.mov', '.avi', '.mkv', '.webm',
  '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx',
  '.mp3', '.wav', '.ogg', '.m4a'
];

const TEMP_DIR = path.join(process.cwd(), 'temp_url_uploads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function cleanupOldFiles() {
  try {
    if (!fs.existsSync(TEMP_DIR)) return;
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    for (const file of files) {
      try {
        const filePath = path.join(TEMP_DIR, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > oneHour) fs.unlinkSync(filePath);
      } catch {}
    }
  } catch {}
}

function generateUniqueFilename(originalName = 'file') {
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `upload_${timestamp}_${random}${ext}`;
}

function getExtensionFromBuffer(buffer) {
  if (!buffer || buffer.length < 4) return null;
  const hex = buffer.slice(0, 8).toString('hex').toUpperCase();
  if (hex.startsWith('FFD8FF')) return '.jpg';
  if (hex.startsWith('89504E47')) return '.png';
  if (hex.startsWith('47494638')) return '.gif';
  if (hex.startsWith('52494646') && buffer.includes('WEBP')) return '.webp';
  if (hex.startsWith('424D')) return '.bmp';
  if (hex.includes('66747970') || hex.includes('6D6F6F76')) return '.mp4';
  if (hex.startsWith('1A45DFA3')) return '.webm';
  if (hex.startsWith('25504446')) return '.pdf';
  return null;
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const typeMap = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska', '.webm': 'video/webm',
    '.pdf': 'application/pdf', '.txt': 'text/plain',
    '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4'
  };
  return typeMap[ext] || 'application/octet-stream';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isFileSupported(filename, buffer = null) {
  const ext = path.extname(filename).toLowerCase();
  if (SUPPORTED_EXTENSIONS.includes(ext)) return true;
  if (buffer && !ext) {
    const detectedExt = getExtensionFromBuffer(buffer);
    return detectedExt && SUPPORTED_EXTENSIONS.includes(detectedExt);
  }
  return false;
}

async function uploadToImgBB(buffer, filename) {
  try {
    const base64 = buffer.toString("base64");
    const apiKey = UPLOAD_SERVICES.IMGBB.apiKey;
    const formData = new URLSearchParams();
    formData.append("key", apiKey);
    formData.append("image", base64);
    formData.append("name", filename);
    formData.append("expiration", "0");

    const response = await axios.post(
      UPLOAD_SERVICES.IMGBB.url,
      formData.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        timeout: 45000
      }
    );

    if (response.data.success && response.data.data) {
      const data = response.data.data;
      return {
        success: true, url: data.url, displayUrl: data.display_url,
        thumb: data.thumb?.url || data.url, deleteUrl: data.delete_url,
        id: data.id, format: data.image?.extension || 'jpg',
        width: data.width, height: data.height, size: data.size,
        service: 'ImgBB', permanent: true
      };
    }
    return { success: false, error: response.data.error?.message || "ImgBB upload failed" };
  } catch (error) {
    let errorMsg = "ImgBB upload failed";
    if (error.response?.data?.error?.code === 105) errorMsg = "Invalid ImgBB API key";
    else if (error.response?.data?.error?.code === 120) errorMsg = "File too large (max 32MB)";
    else if (error.code === 'ECONNABORTED') errorMsg = "Upload timeout";
    return { success: false, error: errorMsg };
  }
}

async function uploadToTelegraph(buffer, filename) {
  try {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: getContentType(filename) });
    formData.append('file', blob, filename);
    const response = await fetch(UPLOAD_SERVICES.TELEGRAPH.url, { method: 'POST', body: formData });
    const data = await response.json();
    const url = data && data[0] && data[0].src ? `https://telegra.ph${data[0].src}` : null;
    if (url) return { success: true, url, service: 'Telegra.ph', permanent: true };
    return { success: false, error: "Telegraph upload failed" };
  } catch {
    return { success: false, error: "Telegraph upload failed" };
  }
}

async function uploadToZeroXZero(buffer, filename) {
  try {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: getContentType(filename) });
    formData.append('file', blob, filename);
    const response = await fetch(UPLOAD_SERVICES.ZEROXZERO.url, { method: 'POST', body: formData });
    const url = (await response.text()).trim();
    if (url && url.startsWith('http')) return { success: true, url, service: '0x0.st', permanent: false };
    return { success: false, error: "0x0.st upload failed" };
  } catch {
    return { success: false, error: "0x0.st upload failed" };
  }
}

async function uploadToFileIO(buffer, filename) {
  try {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: getContentType(filename) });
    formData.append('file', blob, filename);
    const response = await fetch(UPLOAD_SERVICES.FILEIO.url, { method: 'POST', body: formData });
    const data = JSON.parse(await response.text());
    if (data.success && data.link) return { success: true, url: data.link, service: 'File.io', permanent: false };
    return { success: false, error: "File.io upload failed" };
  } catch {
    return { success: false, error: "File.io upload failed" };
  }
}

async function uploadFile(buffer, filename) {
  const ext = path.extname(filename).toLowerCase();
  const fileSize = buffer.length;

  if (UPLOAD_SERVICES.IMGBB.supported.includes(ext) && fileSize <= UPLOAD_SERVICES.IMGBB.maxSize) {
    const result = await uploadToImgBB(buffer, filename);
    if (result.success) return result;
  }
  if (UPLOAD_SERVICES.TELEGRAPH.supported.includes(ext) && fileSize <= UPLOAD_SERVICES.TELEGRAPH.maxSize) {
    const result = await uploadToTelegraph(buffer, filename);
    if (result.success) return result;
  }
  if (fileSize <= UPLOAD_SERVICES.ZEROXZERO.maxSize) {
    const result = await uploadToZeroXZero(buffer, filename);
    if (result.success) return result;
  }
  if (fileSize <= UPLOAD_SERVICES.FILEIO.maxSize) {
    const result = await uploadToFileIO(buffer, filename);
    if (result.success) return result;
  }
  return { success: false, error: 'All upload services failed' };
}

export default {
  name: "url",
  alias: ["upload", "tourl", "geturl", "fileurl"],
  description: "Upload media/files and get shareable URLs",
  category: "utility",

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;

    cleanupOldFiles();

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const hasUrl = args.length > 0 && args[0].startsWith('http');

    if (!quoted && !hasUrl) {
      return sock.sendMessage(jid, {
        text:
          `\u250C\u2500\u29ED *URL Upload*\n` +
          `\u2502\n` +
          `\u2502 Upload media and get permanent URLs\n` +
          `\u2502\n` +
          `\u2502 Usage:\n` +
          `\u2502 Reply to any media with ${PREFIX}url\n` +
          `\u2502 Or: ${PREFIX}url <image_url>\n` +
          `\u2502\n` +
          `\u2502 Supported Files:\n` +
          `\u2502 Images: JPG, PNG, GIF, WebP\n` +
          `\u2502 Videos: MP4, MOV, AVI, WebM\n` +
          `\u2502 Docs: PDF, TXT, DOC, XLS\n` +
          `\u2502 Audio: MP3, WAV, OGG\n` +
          `\u2502\n` +
          `\u2502 Max Sizes:\n` +
          `\u2502 ImgBB: 32MB (images, permanent)\n` +
          `\u2502 Telegraph: 5MB (images)\n` +
          `\u2502 0x0.st: 512MB (any file)\n` +
          `\u2502 File.io: 2GB (any file)\n` +
          `\u2514\u2500\u29ED`
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '\u23F3', key: m.key } });

      let buffer, filename;

      if (hasUrl) {
        const imageUrl = args[0];
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          filename = generateUniqueFilename(path.basename(imageUrl.split('?')[0]));
        } catch (error) {
          await sock.sendMessage(jid, { react: { text: '\u274C', key: m.key } });
          return sock.sendMessage(jid, {
            text: `\u250C\u2500\u29ED *URL Upload*\n\u2502 Download failed: ${error.message}\n\u2514\u2500\u29ED`
          }, { quoted: m });
        }
      } else {
        const messageObj = { key: m.key, message: quoted };
        try {
          buffer = await downloadMediaMessage(
            messageObj, "buffer", {},
            { reuploadRequest: sock.updateMediaMessage, logger: console }
          );
          if (!buffer || buffer.length === 0) throw new Error("Empty buffer received");

          let originalName = 'file';
          if (quoted.documentMessage?.fileName) originalName = quoted.documentMessage.fileName;
          else if (quoted.imageMessage) originalName = 'image.jpg';
          else if (quoted.videoMessage) originalName = 'video.mp4';
          else if (quoted.audioMessage) originalName = 'audio.mp3';
          filename = generateUniqueFilename(originalName);
        } catch (error) {
          await sock.sendMessage(jid, { react: { text: '\u274C', key: m.key } });
          return sock.sendMessage(jid, {
            text: `\u250C\u2500\u29ED *URL Upload*\n\u2502 Failed to download media\n\u2502 Try sending a fresh file\n\u2514\u2500\u29ED`
          }, { quoted: m });
        }
      }

      if (!isFileSupported(filename, buffer)) {
        await sock.sendMessage(jid, { react: { text: '\u274C', key: m.key } });
        return sock.sendMessage(jid, {
          text: `\u250C\u2500\u29ED *URL Upload*\n\u2502 File type not supported\n\u2502 Supported: JPG, PNG, GIF,\n\u2502 WebP, MP4, PDF, MP3\n\u2514\u2500\u29ED`
        }, { quoted: m });
      }

      const fileSizeMB = buffer.length / (1024 * 1024);
      await sock.sendMessage(jid, { react: { text: '\uD83D\uDCE4', key: m.key } });

      const uploadResult = await uploadFile(buffer, filename);

      if (!uploadResult.success) {
        await sock.sendMessage(jid, { react: { text: '\u274C', key: m.key } });
        return sock.sendMessage(jid, {
          text: `\u250C\u2500\u29ED *URL Upload*\n\u2502 Upload failed: ${uploadResult.error}\n\u2514\u2500\u29ED`
        }, { quoted: m });
      }

      const { url, service, permanent, width, height } = uploadResult;

      const successCaption =
        `\u250C\u2500\u29ED *Upload Successful*\n` +
        `\u2502\n` +
        `\u2502 ${width && height ? `${width} x ${height} - ` : ''}${fileSizeMB.toFixed(2)} MB\n` +
        `\u2502 Service: ${service || 'Auto'}${permanent ? ' (Permanent)' : ''}\n` +
        `\u2502\n` +
        `\u2502 URL:\n` +
        `\u2502 ${url}\n` +
        `\u2514\u2500\u29ED`;

      try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const { sendInteractiveMessage } = require('gifted-btns');
        await sendInteractiveMessage(sock, jid, {
          text: successCaption,
          footer: `${extra.BOT_NAME || 'Foxy Bot'}`,
          interactiveButtons: [
            {
              name: 'cta_copy',
              buttonParamsJson: JSON.stringify({
                display_text: 'Copy URL',
                copy_code: url
              })
            },
            {
              name: 'cta_url',
              buttonParamsJson: JSON.stringify({
                display_text: 'Open in Browser',
                url: url
              })
            }
          ]
        });
      } catch (btnErr) {
        if (getContentType(filename).startsWith('image/')) {
          try {
            await sock.sendMessage(jid, { image: buffer, caption: successCaption });
          } catch {
            await sock.sendMessage(jid, { text: successCaption }, { quoted: m });
          }
        } else {
          await sock.sendMessage(jid, { text: successCaption }, { quoted: m });
        }
      }

      await sock.sendMessage(jid, { react: { text: '\u2705', key: m.key } });

    } catch (error) {
      await sock.sendMessage(jid, { react: { text: '\u274C', key: m.key } });
      return sock.sendMessage(jid, {
        text: `\u250C\u2500\u29ED *URL Upload*\n\u2502 Error: ${error.message || 'Unknown error'}\n\u2514\u2500\u29ED`
      }, { quoted: m });
    }
  }
};

export const urlUtils = {
  upload: async (buffer, filename = 'file') => await uploadFile(buffer, filename),
  getServices: () => Object.values(UPLOAD_SERVICES).map(s => ({
    name: s.name, maxSize: formatFileSize(s.maxSize),
    supported: s.supported === '*' ? 'All files' : s.supported.join(', '),
    permanent: s.permanent ? 'Yes' : 'No'
  })),
  getApiKeyStatus: () => {
    const apiKey = getImgBBKey();
    return {
      configured: apiKey && apiKey.length === 32,
      valid: apiKey?.startsWith('60c3e5e3') || false
    };
  },
  clearTemp: () => {
    try {
      if (!fs.existsSync(TEMP_DIR)) return 'No temp directory';
      const files = fs.readdirSync(TEMP_DIR);
      let deleted = 0;
      for (const file of files) {
        try { fs.unlinkSync(path.join(TEMP_DIR, file)); deleted++; } catch {}
      }
      return `Cleared ${deleted} temporary files`;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
};