const http = require('http');
const https = require('https');

function getAIConfig() {
  const provider = String(process.env.AI_PROVIDER || '').trim();
  const apiKey = String(process.env.AI_API_KEY || '').trim();
  const model = String(process.env.AI_MODEL || '').trim();
  const baseUrl = resolveBaseUrl(provider, process.env.AI_BASE_URL || '');
  const reasoningEffort = String(process.env.AI_REASONING_EFFORT || '').trim();
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || '12000', 10);

  return {
    provider,
    apiKey,
    model,
    baseUrl,
    reasoningEffort,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 12000
  };
}

function resolveBaseUrl(provider, configuredBaseUrl) {
  const baseUrl = String(configuredBaseUrl || '').trim();
  if (baseUrl) {
    return baseUrl.replace(/\/$/, '');
  }

  const normalizedProvider = String(provider || '').trim().toLowerCase();
  const providerBaseUrls = {
    openai: 'https://api.openai.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    kimi: 'https://api.moonshot.cn/v1',
    moonshot: 'https://api.moonshot.cn/v1',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    dashscope: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    stepfun: 'https://api.stepfun.com/step_plan/v1',
    siliconflow: 'https://api.siliconflow.cn/v1',
    compatible: 'https://api.openai.com/v1'
  };

  return providerBaseUrls[normalizedProvider] || '';
}

function isAIConfigured() {
  const config = getAIConfig();
  return !!config.provider && !!config.apiKey && !!config.model && !!config.baseUrl;
}

function getAIStatus() {
  const config = getAIConfig();
  if (!config.provider || !config.apiKey || !config.model || !config.baseUrl) {
    return {
      configured: false,
      provider: config.provider || null,
      model: config.model || null,
      reason: 'AI_NOT_CONFIGURED'
    };
  }

  return {
    configured: true,
    provider: config.provider,
    model: config.model,
    reasoning_effort: config.reasoningEffort || null,
    timeout_ms: config.timeoutMs,
    base_url: config.baseUrl
  };
}

async function generateAIAnswer(prompt, options = {}) {
  const status = getAIStatus();
  if (!status.configured) {
    return {
      success: false,
      code: status.reason,
      message: 'AI服务配置中，已使用知识库建议'
    };
  }

  try {
    const config = getAIConfig();
    const messages = buildMessages(prompt, options);
    const payload = {
      model: config.model,
      messages,
      temperature: clampNumber(options.temperature, 0.2, 0, 2),
      max_tokens: clampNumber(options.maxTokens, 900, 1, 8192)
    };
    const finalReasoningEffort = String(options.reasoningEffort || config.reasoningEffort || '').trim();
    if (finalReasoningEffort) {
      payload.reasoning_effort = finalReasoningEffort;
    }

    const response = await postJson(`${config.baseUrl}/chat/completions`, payload, {
      timeoutMs: config.timeoutMs,
      headers: buildHeaders(config, options)
    });

    const content = extractAnswer(response.body);
    if (!content) {
      return {
        success: false,
        code: 'AI_EMPTY_RESPONSE',
        message: 'AI服务返回空内容，已使用知识库建议'
      };
    }

    return {
      success: true,
      answer: content,
      provider: config.provider,
      model: config.model,
      usage: response.body && response.body.usage ? response.body.usage : null
    };
  } catch (error) {
    return {
      success: false,
      code: error.code || 'AI_REQUEST_FAILED',
      message: error.message || 'AI服务调用失败，已使用知识库建议'
    };
  }
}

function buildMessages(prompt, options) {
  if (Array.isArray(options.messages) && options.messages.length) {
    return options.messages;
  }

  const systemPrompt = String(options.systemPrompt || '').trim();
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: String(prompt || '') });
  return messages;
}

function buildHeaders(config, options) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`
  };

  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = String(process.env.AI_APP_URL || '').trim() || 'https://api.woyai.cn';
    headers['X-Title'] = String(process.env.AI_APP_NAME || '').trim() || 'niuniu-parenting';
  }

  if (options.extraHeaders && typeof options.extraHeaders === 'object') {
    return Object.assign(headers, options.extraHeaders);
  }

  return headers;
}

function extractAnswer(body) {
  const choices = body && Array.isArray(body.choices) ? body.choices : [];
  const message = choices[0] && choices[0].message;
  if (!message) return '';

  const content = typeof message.content === 'string' ? message.content.trim() : '';
  if (content) return content;

  // 推理模型 fallback: content 为空时尝试使用 reasoning_content 或 reasoning
  const reasoning = typeof message.reasoning_content === 'string' && message.reasoning_content.trim()
    ? message.reasoning_content.trim()
    : typeof message.reasoning === 'string' && message.reasoning.trim()
      ? message.reasoning.trim()
      : '';

  return reasoning;
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

function postJson(urlString, body, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const transport = url.protocol === 'http:' ? http : https;
    const payload = JSON.stringify(body);
    const request = transport.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      headers: Object.assign({
        'Content-Length': Buffer.byteLength(payload)
      }, options.headers || {}),
      timeout: options.timeoutMs || 12000
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        let parsedBody = null;
        try {
          parsedBody = raw ? JSON.parse(raw) : {};
        } catch (error) {
          reject({ code: 'AI_BAD_RESPONSE', message: 'AI服务返回了无法解析的数据' });
          return;
        }

        if (response.statusCode && response.statusCode >= 400) {
          reject({
            code: 'AI_HTTP_ERROR',
            message: readErrorMessage(parsedBody, response.statusCode)
          });
          return;
        }

        resolve({ statusCode: response.statusCode, body: parsedBody });
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error('AI服务请求超时'));
    });
    request.on('error', (error) => {
      reject({ code: 'AI_REQUEST_FAILED', message: error.message || 'AI服务请求失败' });
    });
    request.write(payload);
    request.end();
  });
}

function readErrorMessage(body, statusCode) {
  const apiMessage = body && body.error && body.error.message;
  return apiMessage || `AI服务响应异常(${statusCode})`;
}

module.exports = {
  getAIConfig,
  isAIConfigured,
  getAIStatus,
  generateAIAnswer
};
