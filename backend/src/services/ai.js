const AI_PROVIDER = process.env.AI_PROVIDER || '';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '8000', 10);

function isAIConfigured() {
  return !!AI_PROVIDER && !!AI_API_KEY;
}

function getAIStatus() {
  if (!isAIConfigured()) {
    return {
      configured: false,
      provider: AI_PROVIDER || null,
      reason: 'AI_NOT_CONFIGURED'
    };
  }

  return {
    configured: true,
    provider: AI_PROVIDER,
    timeout_ms: AI_TIMEOUT_MS
  };
}

async function generateAIAnswer() {
  const status = getAIStatus();
  if (!status.configured) {
    return {
      success: false,
      code: status.reason,
      message: 'AI服务配置中，已使用知识库建议'
    };
  }

  return {
    success: false,
    code: 'AI_PROVIDER_NOT_IMPLEMENTED',
    message: 'AI服务接入中，已使用知识库建议'
  };
}

module.exports = {
  isAIConfigured,
  getAIStatus,
  generateAIAnswer
};
