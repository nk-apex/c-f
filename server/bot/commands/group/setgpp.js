import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

// Helper function to upload to ImgBB (from your imgbb command)
async function uploadToImgBB(buffer) {
  try {
    // Use your API key method
    const apiKey = '60c3e5e339bbed1a90470b2938feab62';
    const base64 = buffer.toString("base64");
    
    const formData = new URLSearchParams();
    formData.append("key", apiKey);
    formData.append("image", base64);
    
    const res = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData.toString(),
      {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        timeout: 30000
      }
    );

    if (res.data.success && res.data.data) {
      return res.data.data.url; // Direct image URL
    }
    
    throw new Error("ImgBB upload failed");
    
  } catch (error) {
    console.error("ImgBB upload error:", error.message);
    throw error;
  }
}

export default {
  name: 'setgpp',
  alias: ['setgrouppp', 'changeprofile', 'setpic'],
  category: 'group',
  description: 'Change group profile picture (uses ImgBB)',
  
  async execute(sock, msg, args, PREFIX, extra) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;
    
    // Check if group
    if (!jid.endsWith('@g.us')) {
      await sock.sendMessage(jid, { 
        text: '❌ This command only works in groups.' 
      }, { quoted: msg });
      return;
    }

    // Check if user is admin
    let groupMetadata;
    try {
      groupMetadata = await sock.groupMetadata(jid);
    } catch (error) {
      await sock.sendMessage(jid, { 
        text: '❌ Failed to get group info.' 
      }, { quoted: msg });
      return;
    }

    const senderParticipant = groupMetadata.participants.find(p => p.id === sender);
    if (!senderParticipant?.admin) {
      await sock.sendMessage(jid, { 
        text: '🛑 Only group admins can change group picture.' 
      }, { quoted: msg });
      return;
    }

    // Check for image
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const hasImage = msg.message?.imageMessage || 
                    (msg.message?.documentMessage?.mimetype?.includes('image')) ||
                    quoted?.imageMessage;

    // Check if URL provided in args
    let imageUrl = '';
    if (args.length > 0 && (args[0].startsWith('http://') || args[0].startsWith('https://'))) {
      imageUrl = args[0];
    }

    if (!hasImage && !imageUrl) {
      await sock.sendMessage(jid, { 
        text: `🖼️ *Set Group Profile Picture* 🦊\n\n` +
              `*Usage:*\n` +
              `1. Reply to an image:\n   ${PREFIX}setgpp (reply to image)\n\n` +
              `2. Use image URL:\n   ${PREFIX}setgpp https://example.com/image.jpg\n\n` +
              `*Note:* Images are uploaded to ImgBB first for better reliability.`
      }, { quoted: msg });
      return;
    }

    try {
      // 🖼️ Picture reaction (shows command started)
      await sock.sendMessage(jid, {
        react: { text: "🖼️", key: msg.key }
      });

      let finalImageUrl = '';
      let processingMessage;

      // Method 1: Using provided URL
      if (imageUrl) {
        finalImageUrl = imageUrl;
      }
      // Method 2: Download and upload image
      else if (hasImage) {
        // Send processing message
        processingMessage = await sock.sendMessage(jid, { 
          text: '⏳ Uploading image to ImgBB... 🦊' 
        }, { quoted: msg });
        
        try {
          // Determine which image to download
          let imageToDownload;
          
          if (quoted?.imageMessage) {
            // Create message object for download from quoted message
            const quotedMsgObj = {
              key: {
                remoteJid: jid,
                fromMe: false,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage.contextInfo.participant
              },
              message: { ...quoted }
            };
            
            // Download using baileys
            const buffer = await downloadMediaMessage(
              quotedMsgObj,
              "buffer",
              {},
              { 
                reuploadRequest: sock.updateMediaMessage,
                logger: console
              }
            );
            
            if (!buffer || buffer.length === 0) {
              throw new Error("Failed to download image");
            }
            
            // Upload to ImgBB silently
            finalImageUrl = await uploadToImgBB(buffer);
            
          } else if (msg.message?.imageMessage) {
            // Download current message image
            const buffer = await downloadMediaMessage(
              msg,
              "buffer",
              {},
              { 
                reuploadRequest: sock.updateMediaMessage,
                logger: console
              }
            );
            
            if (!buffer || buffer.length === 0) {
              throw new Error("Failed to download image");
            }
            
            // Upload to ImgBB silently
            finalImageUrl = await uploadToImgBB(buffer);
          }
          
        } catch (downloadError) {
          console.error('Download/upload error:', downloadError);
          
          if (processingMessage) {
            await sock.sendMessage(jid, { 
              text: '❌ Failed to process image. Try sending the image again.',
              edit: processingMessage.key
            });
          } else {
            await sock.sendMessage(jid, { 
              text: '❌ Failed to process image.'
            }, { quoted: msg });
          }
          return;
        }
      }

      if (!finalImageUrl) {
        await sock.sendMessage(jid, { 
          text: '❌ Could not get image URL.' 
        }, { quoted: msg });
        return;
      }

      // Update processing message
      if (processingMessage) {
        await sock.sendMessage(jid, { 
          text: '🔄 Setting group picture... 🦊',
          edit: processingMessage.key
        });
      }

      // 🦊 SILENTLY SET GROUP PICTURE
      try {
        await sock.updateProfilePicture(jid, { url: finalImageUrl });
        
        // Success message
        const successMessage = `✅ Group profile picture updated successfully! 🦊\n\n` +
                              `*Image hosted on:* ImgBB\n` +
                              `*Quality:* Permanent storage`;
        
        if (processingMessage) {
          await sock.sendMessage(jid, { 
            text: successMessage,
            edit: processingMessage.key
          });
        } else {
          await sock.sendMessage(jid, { 
            text: successMessage 
          }, { quoted: msg });
        }
        
        // Optional: Show the new picture
        try {
          setTimeout(async () => {
            const updatedGroup = await sock.groupMetadata(jid);
            if (updatedGroup.preview) {
              await sock.sendMessage(jid, {
                image: { url: updatedGroup.preview },
                caption: '🦊 New group picture!'
              });
            }
          }, 1000);
        } catch (previewError) {
          // Silent fail
        }
        
        console.log(`🖼️ Group picture changed by ${sender.split('@')[0]} via ImgBB`);
        
      } catch (updateError) {
        console.error('Profile picture update error:', updateError);
        
        const errorMsg = processingMessage ? 
          { text: '❌ Failed to update group picture. Make sure I have admin rights.', edit: processingMessage.key } :
          { text: '❌ Failed to update group picture.', quoted: msg };
          
        await sock.sendMessage(jid, errorMsg);
      }
      
    } catch (error) {
      console.error('Setgpp error:', error);
      
      await sock.sendMessage(jid, { 
        text: '❌ An error occurred. Please try again.' 
      }, { quoted: msg });
    }
  }
};