const FaceData = require('../models/FaceData');
const User = require('../models/User');

// ========== REGISTER FACE ==========
const registerFace = async (req, res) => {
  try {
    const { faceEmbedding } = req.body;
    const userId = req.user.id;

    if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
      return res.status(400).json({ message: 'Valid face embedding is required' });
    }

    // Check if face already exists for this user
    let faceData = await FaceData.findOne({ userId });

    if (faceData) {
      // Update existing
      faceData.faceEmbedding = faceEmbedding;
      faceData.lastVerified = new Date();
      await faceData.save();
    } else {
      // Create new
      faceData = await FaceData.create({
        userId,
        faceEmbedding,
        registeredAt: new Date()
      });
    }

    // Update user
    await User.findByIdAndUpdate(userId, { faceIdEnabled: true });

    res.json({
      success: true,
      message: 'Face registered successfully',
      faceData: {
        id: faceData._id,
        registeredAt: faceData.registeredAt,
        lastVerified: faceData.lastVerified
      }
    });
  } catch (error) {
    console.error('Face register error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== VERIFY FACE ==========
const verifyFace = async (req, res) => {
  try {
    const { faceEmbedding } = req.body;
    const userId = req.user.id;

    if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
      return res.status(400).json({ message: 'Valid face embedding is required' });
    }

    const faceData = await FaceData.findOne({ userId });
    if (!faceData) {
      return res.status(404).json({ message: 'Face not registered for this user' });
    }

    // Simple similarity check (Euclidean distance)
    // In production, use a proper face recognition library
    const similarity = calculateSimilarity(faceEmbedding, faceData.faceEmbedding);
    const threshold = 0.85; // 85% similarity threshold

    if (similarity >= threshold) {
      faceData.lastVerified = new Date();
      await faceData.save();
      return res.json({
        success: true,
        message: 'Face verified successfully',
        similarity: similarity
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Face verification failed',
        similarity: similarity
      });
    }
  } catch (error) {
    console.error('Face verify error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET FACE STATUS ==========
const getFaceStatus = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const faceData = await FaceData.findOne({ userId });
    const user = await User.findById(userId).select('faceIdEnabled');

    res.json({
      success: true,
      faceIdEnabled: user?.faceIdEnabled || false,
      faceData: faceData ? {
        registeredAt: faceData.registeredAt,
        lastVerified: faceData.lastVerified,
        isActive: faceData.isActive
      } : null
    });
  } catch (error) {
    console.error('Face status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== HELPER: Calculate Similarity ==========
function calculateSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }

  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

module.exports = {
  registerFace,
  verifyFace,
  getFaceStatus
};
