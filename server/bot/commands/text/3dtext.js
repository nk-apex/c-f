import { createCanvas } from 'canvas';

export default {
  name: "3dtext",
  alias: ["threed", "3dlogo"],
  description: "Create realistic 3D text effects",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `🧊 *3D Text*\n\nUsage: 3dtext <text>\n\n*Examples:*\n• 3dtext DEPTH\n• 3dtext 3D EFFECT\n• 3dtext SHADOW` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ");
      
      if (text.length > 15) {
        await sock.sendMessage(jid, { 
          text: `⚠️ Text too long! Max 15 characters for 3D effect.\n(Currently: ${text.length})` 
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, { 
        text: `🧊 Creating 3D text: "${text}"...` 
      }, { quoted: m });

      const logoBuffer = await generate3DText(text);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `🧊 *3D Text Generated!*\nText: ${text}\nDepth: 50px`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [3DTEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

async function generate3DText(text) {
  const width = 800;
  const height = 500; // Taller for 3D effect
  const depth = 50; // 3D depth in pixels
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#1a1a2e');
  bgGradient.addColorStop(1, '#16213e');
  
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle grid floor
  draw3DGrid(ctx, width, height, depth);

  // Main 3D text
  draw3DEffect(ctx, text, width, height, depth);

  // Add lighting effects
  add3DLighting(ctx, width, height);

  return canvas.toBuffer('image/png');
}

function draw3DGrid(ctx, width, height, depth) {
  // Perspective grid floor
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  const centerX = width / 2;
  const floorY = height - 100;
  
  // Grid lines going back in perspective
  for (let i = -5; i <= 5; i++) {
    const x = centerX + i * 60;
    
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(centerX + i * 20, height);
    ctx.stroke();
  }
  
  // Horizontal floor line
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();
}

function draw3DEffect(ctx, text, width, height, depth) {
  const centerX = width / 2;
  const centerY = height / 2 - 50;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 100px "Arial"';
  
  // Draw 3D sides (extrusion)
  for (let d = depth; d > 0; d--) {
    const offsetX = d * 0.3;
    const offsetY = d * 0.7;
    
    // Darker color for back faces
    const darkness = 1 - (d / depth) * 0.7;
    ctx.fillStyle = `rgba(74, 144, 226, ${darkness * 0.7})`;
    
    ctx.fillText(text.toUpperCase(), centerX + offsetX, centerY + offsetY);
  }
  
  // Front face (main text)
  const frontGradient = ctx.createLinearGradient(0, centerY - 50, 0, centerY + 50);
  frontGradient.addColorStop(0, '#4a90e2');
  frontGradient.addColorStop(1, '#2c5282');
  
  ctx.fillStyle = frontGradient;
  ctx.fillText(text.toUpperCase(), centerX, centerY);
  
  // Front face highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText(text.toUpperCase(), centerX - 2, centerY - 2);
  
  // Top face (different color)
  const topGradient = ctx.createLinearGradient(0, centerY - depth - 50, 0, centerY - 50);
  topGradient.addColorStop(0, '#63b3ed');
  topGradient.addColorStop(1, '#4a90e2');
  
  // Draw top face
  const textWidth = ctx.measureText(text).width;
  const topFaceY = centerY - depth;
  
  ctx.fillStyle = topGradient;
  ctx.fillRect(centerX - textWidth/2, topFaceY - 20, textWidth, depth + 20);
  
  // Add text on top face (perspective corrected)
  ctx.save();
  ctx.translate(centerX, topFaceY);
  ctx.scale(1, 0.3);
  ctx.rotate(-0.1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 80px "Arial"';
  ctx.fillText(text.toUpperCase(), 0, 0);
  ctx.restore();
}

function add3DLighting(ctx, width, height) {
  // Light source glow
  const lightX = width * 0.7;
  const lightY = height * 0.3;
  
  const lightGradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 200);
  lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  lightGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = lightGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Specular highlights on text
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(width * 0.6, height * 0.4, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;
  
  // Cast shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(width / 2, height - 80, 300, 50, 0, 0, Math.PI * 2);
  ctx.fill();
}