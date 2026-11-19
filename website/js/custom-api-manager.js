/**
 * JANASEVA – Custom API Builder, API Key Vault & Centralized API Control Centre
 * 
 * Production-ready Custom API Management System:
 * - 7-Step Guided Configuration Wizard with SSRF verification
 * - AES-GCM 256-bit API Key Vault integration with credential rotation
 * - Dedicated "MY CUSTOM APIS" Dashboard with live telemetry
 * - "HOW TO CONNECT MY API" verified documentation guide
 * - Centralized API Service Routing (AI, Multilingual, RAG, Database, Email, WhatsApp, Maps, OCR)
 */

(function(window) {
  'use strict';

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(msg, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else if (typeof window.janasevaShowToast === 'function') {
      window.janasevaShowToast(msg, type);
    } else {
      console.log(`[Toast ${type}] ${msg}`);
    }
  }

  // Pre-configured Verified Provider Templates
  const PROVIDER_TEMPLATES = {
    gemini: {
      providerName: 'Google Gemini',
      displayName: 'Gemini 2.5 Flash Multilingual',
      category: 'ai',
      providerWebsite: 'https://aistudio.google.com',
      docsUrl: 'https://ai.google.dev/docs',
      providerType: 'GEMINI_COMPATIBLE',
      baseUrl: 'https://generativelanguage.googleapis.com',
      endpoint: '/v1beta/models/gemini-2.5-flash:generateContent',
      httpMethod: 'POST',
      contentType: 'application/json',
      authType: 'API_KEY_HEADER',
      authHeaderName: 'x-goog-api-key',
      assignedService: 'ai_assistant',
      aiConfig: {
        modelName: 'gemini-2.5-flash',
        modelId: 'gemini-2.5-flash',
        maxTokens: 2048,
        temperature: 0.3,
        requestFormat: 'gemini_standard',
        responsePath: 'candidates[0].content.parts[0].text',
        streamingSupport: false
      }
    },
    openai: {
      providerName: 'OpenAI',
      displayName: 'OpenAI GPT-4o Mini',
      category: 'ai',
      providerWebsite: 'https://platform.openai.com',
      docsUrl: 'https://platform.openai.com/docs/api-reference',
      providerType: 'OPENAI_COMPATIBLE',
      baseUrl: 'https://api.openai.com/v1',
      endpoint: '/chat/completions',
      httpMethod: 'POST',
      contentType: 'application/json',
      authType: 'BEARER_TOKEN',
      assignedService: 'ai_assistant',
      aiConfig: {
        modelName: 'gpt-4o-mini',
        modelId: 'gpt-4o-mini',
        maxTokens: 2048,
        temperature: 0.3,
        requestFormat: 'openai_standard',
        responsePath: 'choices[0].message.content',
        streamingSupport: false
      }
    },
    groq: {
      providerName: 'Groq Cloud',
      displayName: 'DeepSeek R1 via Groq Ultra-Fast',
      category: 'ai',
      providerWebsite: 'https://console.groq.com',
      docsUrl: 'https://docs.groq.com/docs/openai',
      providerType: 'OPENAI_COMPATIBLE',
      baseUrl: 'https://api.groq.com/openai/v1',
      endpoint: '/chat/completions',
      httpMethod: 'POST',
      contentType: 'application/json',
      authType: 'BEARER_TOKEN',
      assignedService: 'ai_assistant',
      aiConfig: {
        modelName: 'deepseek-r1-distill-llama-70b',
        modelId: 'deepseek-r1-distill-llama-70b',
        maxTokens: 2048,
        temperature: 0.3,
        requestFormat: 'openai_standard',
        responsePath: 'choices[0].message.content',
        streamingSupport: false
      }
    },
    anthropic: {
      providerName: 'Anthropic',
      displayName: 'Claude 3.5 Sonnet Assistant',
      category: 'ai',
      providerWebsite: 'https://console.anthropic.com',
      docsUrl: 'https://docs.anthropic.com/en/api',
      providerType: 'ANTHROPIC_COMPATIBLE',
      baseUrl: 'https://api.anthropic.com/v1',
      endpoint: '/messages',
      httpMethod: 'POST',
      contentType: 'application/json',
      authType: 'API_KEY_HEADER',
      authHeaderName: 'x-api-key',
      customHeaders: '{"anthropic-version": "2023-06-01"}',
      assignedService: 'ai_assistant',
      aiConfig: {
        modelName: 'claude-3-5-sonnet-20241022',
        modelId: 'claude-3-5-sonnet-20241022',
        maxTokens: 2048,
        temperature: 0.3,
        requestFormat: 'anthropic_standard',
        responsePath: 'content[0].text',
        streamingSupport: false
      }
    },
    ollama: {
      providerName: 'Ollama Local / Self-Hosted',
      displayName: 'Local Llama 3 on Panchayat Server',
      category: 'ai',
      providerWebsite: 'https://ollama.com',
      docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
      providerType: 'OPENAI_COMPATIBLE',
      baseUrl: 'http://localhost:11434/v1',
      endpoint: '/chat/completions',
      httpMethod: 'POST',
      contentType: 'application/json',
      authType: 'NO_AUTH',
      allowLocalDev: true,
      assignedService: 'ai_assistant',
      aiConfig: {
        modelName: 'llama3:latest',
        modelId: 'llama3:latest',
        maxTokens: 2048,
        temperature: 0.3,
        requestFormat: 'openai_standard',
        responsePath: 'choices[0].message.content',
        streamingSupport: false
      }
    },
    sendgrid: {
      providerName: 'SendGrid Email API',
      displayName: 'Panchayat Official Mail Relay',
      category: 'email',
      providerWebsite: 'https://sendgrid.com',
      docsUrl: 'https://docs.sendgrid.com/api-reference/mail-send',
      providerType: 'REST_JSON',
      baseUrl: 'https://api.sendgrid.com/v3',
      endpoint: '/mail/send',
      httpMethod: 'POST',
      contentType: 'application/json',
      authType: 'BEARER_TOKEN',
      assignedService: 'email'
    },
    twilio_whatsapp: {
      providerName: 'Twilio WhatsApp API',
      displayName: 'Twilio WhatsApp Citizen Gateway',
      category: 'whatsapp',
      providerWebsite: 'https://www.twilio.com/whatsapp',
      docsUrl: 'https://www.twilio.com/docs/whatsapp/api',
      providerType: 'REST_JSON',
      baseUrl: 'https://api.twilio.com/2010-04-01',
      endpoint: '/Accounts/{AccountSid}/Messages.json',
      httpMethod: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      authType: 'BASIC_AUTH',
      assignedService: 'whatsapp'
    }
  };

  class JanasevaCustomApiManager {
    constructor() {
      this.currentStep = 1;
      this.editingCustomApiId = null;
      this.lastTestResult = null;
    }

    get store() {
      return window.JanasevaApiStore;
    }

    get vault() {
      return window.JanasevaApiVault;
    }

    async init() {
      if (this.store) {
        await this.store.ensureInitialized();
      }
      this.renderCustomApisDashboard();
      this.renderDocGuide();
    }

    // =========================================================================
    // 1. WIZARD CONTROLS (Steps 1 to 7)
    // =========================================================================

    openBuilderWizard(customApiId = null, templateKey = null) {
      this.editingCustomApiId = customApiId;
      this.lastTestResult = null;
      this.currentStep = 1;

      const modal = document.getElementById('modal-custom-api-wizard');
      if (!modal) return;

      const titleEl = document.getElementById('wizard-modal-title');
      if (titleEl) {
        titleEl.innerHTML = customApiId
          ? '<i class="fa-solid fa-pen-to-square"></i> Edit Custom API Integration'
          : '<i class="fa-solid fa-plus-circle"></i> Create My Own API Integration';
      }

      this.resetWizardForm();

      if (customApiId) {
        this.populateWizardWithExisting(customApiId);
      } else if (templateKey && PROVIDER_TEMPLATES[templateKey]) {
        this.populateWizardWithTemplate(PROVIDER_TEMPLATES[templateKey]);
      }

      this.updateStepView(1);
      modal.style.display = 'flex';
    }

    closeBuilderWizard() {
      const modal = document.getElementById('modal-custom-api-wizard');
      if (modal) modal.style.display = 'none';
      this.editingCustomApiId = null;
      this.lastTestResult = null;
    }

    resetWizardForm() {
      const form = document.getElementById('custom-api-wizard-form');
      if (form) form.reset();

      // Set defaults
      const methodSel = document.getElementById('wiz-http-method');
      if (methodSel) methodSel.value = 'POST';
      const catSel = document.getElementById('wiz-api-category');
      if (catSel) catSel.value = 'ai';
      const authSel = document.getElementById('wiz-auth-type');
      if (authSel) authSel.value = 'BEARER_TOKEN';
      const timeoutInput = document.getElementById('wiz-timeout');
      if (timeoutInput) timeoutInput.value = '10000';
      const retryInput = document.getElementById('wiz-retry');
      if (retryInput) retryInput.value = '2';

      this.toggleAuthFields('BEARER_TOKEN');
      this.toggleAiFields('ai');

      const testResultBox = document.getElementById('wiz-test-results-box');
      if (testResultBox) testResultBox.style.display = 'none';
    }

    async populateWizardWithExisting(customApiId) {
      if (!this.store) return;
      const api = await this.store.getCustomApi(customApiId);
      if (!api) return;

      document.getElementById('wiz-provider-name').value = api.providerName || '';
      document.getElementById('wiz-display-name').value = api.name || api.displayName || '';
      document.getElementById('wiz-api-category').value = api.category || 'ai';
      document.getElementById('wiz-provider-website').value = api.providerWebsite || '';
      document.getElementById('wiz-docs-url').value = api.docsUrl || '';
      document.getElementById('wiz-description').value = api.description || '';
      document.getElementById('wiz-provider-type').value = api.providerType || 'REST_JSON';

      document.getElementById('wiz-base-url').value = api.baseUrl || '';
      document.getElementById('wiz-endpoint').value = api.endpoint || '';
      document.getElementById('wiz-http-method').value = api.httpMethod || 'POST';
      document.getElementById('wiz-content-type').value = api.contentType || 'application/json';
      document.getElementById('wiz-timeout').value = api.timeoutMs || 10000;
      document.getElementById('wiz-retry').value = api.retryLimit || 2;

      document.getElementById('wiz-auth-type').value = api.authType || 'BEARER_TOKEN';
      document.getElementById('wiz-auth-header-name').value = api.authHeaderName || '';
      document.getElementById('wiz-auth-param-name').value = api.queryParamName || '';
      document.getElementById('wiz-client-id').value = api.clientId || '';
      document.getElementById('wiz-custom-headers').value = api.customHeaders ? JSON.stringify(api.customHeaders, null, 2) : '';

      // Set masked placeholder for secret
      const keyInput = document.getElementById('wiz-api-key');
      if (keyInput) {
        keyInput.value = '';
        keyInput.placeholder = api.maskedKeyPreview ? `Current: ${api.maskedKeyPreview} (Leave blank to keep)` : 'Enter secret key...';
      }

      if (api.aiConfig) {
        document.getElementById('wiz-ai-model-name').value = api.aiConfig.modelName || '';
        document.getElementById('wiz-ai-model-id').value = api.aiConfig.modelId || '';
        document.getElementById('wiz-ai-max-tokens').value = api.aiConfig.maxTokens || 2048;
        document.getElementById('wiz-ai-temperature').value = api.aiConfig.temperature || 0.3;
        document.getElementById('wiz-ai-req-format').value = api.aiConfig.requestFormat || 'openai_standard';
        document.getElementById('wiz-ai-resp-path').value = api.aiConfig.responsePath || 'choices[0].message.content';
      }

      document.getElementById('wiz-service-assign').value = api.assignedService || 'ai_assistant';
      document.getElementById('wiz-is-primary').checked = Boolean(api.isPrimary);
      document.getElementById('wiz-enable-fallback').checked = api.enableFallback !== false;

      this.toggleAuthFields(api.authType || 'BEARER_TOKEN');
      this.toggleAiFields(api.category || 'ai');
    }

    populateWizardWithTemplate(tpl) {
      document.getElementById('wiz-provider-name').value = tpl.providerName || '';
      document.getElementById('wiz-display-name').value = tpl.displayName || '';
      document.getElementById('wiz-api-category').value = tpl.category || 'ai';
      document.getElementById('wiz-provider-website').value = tpl.providerWebsite || '';
      document.getElementById('wiz-docs-url').value = tpl.docsUrl || '';
      document.getElementById('wiz-provider-type').value = tpl.providerType || 'REST_JSON';

      document.getElementById('wiz-base-url').value = tpl.baseUrl || '';
      document.getElementById('wiz-endpoint').value = tpl.endpoint || '';
      document.getElementById('wiz-http-method').value = tpl.httpMethod || 'POST';
      document.getElementById('wiz-content-type').value = tpl.contentType || 'application/json';
      document.getElementById('wiz-auth-type').value = tpl.authType || 'BEARER_TOKEN';
      document.getElementById('wiz-auth-header-name').value = tpl.authHeaderName || '';
      document.getElementById('wiz-custom-headers').value = tpl.customHeaders || '';
      document.getElementById('wiz-service-assign').value = tpl.assignedService || 'ai_assistant';

      if (tpl.aiConfig) {
        document.getElementById('wiz-ai-model-name').value = tpl.aiConfig.modelName || '';
        document.getElementById('wiz-ai-model-id').value = tpl.aiConfig.modelId || '';
        document.getElementById('wiz-ai-max-tokens').value = tpl.aiConfig.maxTokens || 2048;
        document.getElementById('wiz-ai-temperature').value = tpl.aiConfig.temperature || 0.3;
        document.getElementById('wiz-ai-req-format').value = tpl.aiConfig.requestFormat || 'openai_standard';
        document.getElementById('wiz-ai-resp-path').value = tpl.aiConfig.responsePath || '';
      }

      this.toggleAuthFields(tpl.authType || 'BEARER_TOKEN');
      this.toggleAiFields(tpl.category || 'ai');
      showToast(`Loaded ${tpl.providerName} template. Enter your API key and verify connection.`, 'info');
    }

    toggleAuthFields(authType) {
      const gKey = document.getElementById('wiz-group-api-key');
      const gHeader = document.getElementById('wiz-group-header-name');
      const gParam = document.getElementById('wiz-group-param-name');
      const gClient = document.getElementById('wiz-group-client-id');
      const gSecret = document.getElementById('wiz-group-client-secret');

      if (gKey) gKey.style.display = (authType !== 'NO_AUTH') ? 'block' : 'none';
      if (gHeader) gHeader.style.display = (authType === 'API_KEY_HEADER') ? 'block' : 'none';
      if (gParam) gParam.style.display = (authType === 'QUERY_PARAM') ? 'block' : 'none';
      if (gClient) gClient.style.display = (authType === 'BASIC_AUTH' || authType === 'OAUTH2') ? 'block' : 'none';
      if (gSecret) gSecret.style.display = (authType === 'OAUTH2') ? 'block' : 'none';
    }

    toggleAiFields(category) {
      const step4Nav = document.getElementById('wiz-step-pill-4');
      const isAi = category === 'ai' || category === 'multilingual_ai';
      if (step4Nav) {
        step4Nav.style.opacity = isAi ? '1' : '0.4';
        step4Nav.style.pointerEvents = isAi ? 'auto' : 'none';
      }
    }

    goToStep(targetStep) {
      if (targetStep < 1 || targetStep > 7) return;

      // Validation before stepping forward
      if (targetStep > this.currentStep) {
        if (this.currentStep === 1) {
          const provName = document.getElementById('wiz-provider-name')?.value?.trim();
          const dispName = document.getElementById('wiz-display-name')?.value?.trim();
          if (!provName || !dispName) {
            showToast('Please provide Provider Name and Display Name.', 'warning');
            return;
          }
        } else if (this.currentStep === 2) {
          const baseUrl = document.getElementById('wiz-base-url')?.value?.trim();
          if (!baseUrl) {
            showToast('Please enter an API Base URL.', 'warning');
            return;
          }
        } else if (this.currentStep === 3) {
          const authType = document.getElementById('wiz-auth-type')?.value;
          const key = document.getElementById('wiz-api-key')?.value?.trim();
          if (authType !== 'NO_AUTH' && !key && !this.editingCustomApiId) {
            showToast('Please enter your API Key or Token for authentication.', 'warning');
            return;
          }
        }
      }

      // If stepping to Step 4 and category is not AI, skip directly to Step 5
      const category = document.getElementById('wiz-api-category')?.value;
      const isAi = category === 'ai' || category === 'multilingual_ai';
      if (targetStep === 4 && !isAi) {
        targetStep = (this.currentStep < 4) ? 5 : 3;
      }

      this.updateStepView(targetStep);
    }

    updateStepView(stepNumber) {
      this.currentStep = stepNumber;

      // Update pills
      for (let s = 1; s <= 7; s++) {
        const pill = document.getElementById(`wiz-step-pill-${s}`);
        const panel = document.getElementById(`wiz-panel-step-${s}`);
        if (pill) {
          pill.classList.toggle('active-step', s === stepNumber);
          pill.classList.toggle('completed-step', s < stepNumber);
        }
        if (panel) {
          panel.style.display = (s === stepNumber) ? 'block' : 'none';
        }
      }

      // Update footer buttons
      const btnPrev = document.getElementById('wiz-btn-prev');
      const btnNext = document.getElementById('wiz-btn-next');
      const btnSaveDraft = document.getElementById('wiz-btn-save-draft');
      const btnActivate = document.getElementById('wiz-btn-activate');

      if (btnPrev) btnPrev.style.display = (stepNumber === 1) ? 'none' : 'inline-flex';
      if (btnNext) btnNext.style.display = (stepNumber >= 6) ? 'none' : 'inline-flex';
      if (btnSaveDraft) btnSaveDraft.style.display = (stepNumber === 7) ? 'inline-flex' : 'none';
      if (btnActivate) btnActivate.style.display = (stepNumber === 7) ? 'inline-flex' : 'none';

      // Summary preview on Step 7
      if (stepNumber === 7) {
        this.renderStep7Summary();
      }
    }

    // =========================================================================
    // 2. STEP 6: REAL PROBE TEST
    // =========================================================================

    async runWizardProbeTest() {
      if (!this.store) return;

      const btnTest = document.getElementById('wiz-btn-run-test');
      const resultBox = document.getElementById('wiz-test-results-box');
      if (btnTest) {
        btnTest.disabled = true;
        btnTest.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probing Endpoint...';
      }

      const config = this.gatherFormData();
      const secretKey = document.getElementById('wiz-api-key')?.value?.trim() || null;

      showToast(`Probing ${config.providerName} endpoint with real request...`, 'info');

      try {
        const res = await this.store.testCustomApiConnection(config, secretKey);
        this.lastTestResult = res;

        if (resultBox) {
          resultBox.style.display = 'block';
          const isOk = res.success;
          const statusBg = isOk ? '#f0fdf4' : '#fef2f2';
          const statusBorder = isOk ? '#86efac' : '#fecaca';
          const statusColor = isOk ? '#166534' : '#991b1b';
          const badgeClass = isOk ? 'badge-success' : 'badge-danger';

          resultBox.innerHTML = `
            <div style="background: ${statusBg}; border: 1.5px solid ${statusBorder}; border-radius: 8px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid ${isOk ? 'fa-circle-check' : 'fa-circle-exclamation'}" style="font-size: 18px; color: ${statusColor};"></i>
                  <strong style="color: ${statusColor}; font-size: 14px;">${isOk ? 'Connection Verified & Compatible' : 'Connection Test Failed'}</strong>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="badge" style="background: #e2e8f0; font-size: 11.5px; padding: 3px 8px; border-radius: 4px;">HTTP ${res.httpCode || 0}</span>
                  <span class="badge" style="background: #e0f2fe; color: #0369a1; font-size: 11.5px; padding: 3px 8px; border-radius: 4px;"><i class="fa-solid fa-stopwatch"></i> ${res.latencyMs || 0} ms</span>
                </div>
              </div>
              <p style="font-size: 12.5px; color: #334155; margin: 0 0 10px 0; line-height: 1.5;">${esc(res.message)}</p>
              ${res.responseSnippet ? `
                <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-family: monospace; font-size: 11.5px; color: #475569; max-height: 120px; overflow-y: auto;">
                  ${esc(res.responseSnippet)}
                </div>
              ` : ''}
              ${res.requiresDevConfirm ? `
                <div style="margin-top: 10px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #92400e; cursor: pointer;">
                    <input type="checkbox" id="wiz-dev-override-check" onchange="document.getElementById('wiz-allow-dev-val').value = this.checked ? 'true' : 'false';">
                    <span>Acknowledge Local/Private Subnet Development Mode Exception</span>
                  </label>
                </div>
              ` : ''}
            </div>
          `;
        }

        if (res.success) {
          showToast(`Provider connection verified! (${res.latencyMs} ms)`, 'success');
        } else {
          showToast(`Test failed: ${res.message}`, 'error');
        }
      } catch (err) {
        showToast('Connection test error: ' + err.message, 'error');
      } finally {
        if (btnTest) {
          btnTest.disabled = false;
          btnTest.innerHTML = '<i class="fa-solid fa-bolt"></i> Run Genuine Connection Test';
        }
      }
    }

    renderStep7Summary() {
      const summaryBox = document.getElementById('wiz-step7-summary');
      if (!summaryBox) return;

      const cfg = this.gatherFormData();
      const testPassed = this.lastTestResult && this.lastTestResult.success;

      summaryBox.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #0b2545; font-size: 14px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-list-check" style="color: #0f766e;"></i> Configuration Readiness Review
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 12.5px;">
            <div><span style="color: #64748b;">Provider:</span> <strong>${esc(cfg.providerName)}</strong></div>
            <div><span style="color: #64748b;">API Name:</span> <strong>${esc(cfg.name)}</strong></div>
            <div><span style="color: #64748b;">Category:</span> <strong>${esc(cfg.category.toUpperCase())}</strong></div>
            <div><span style="color: #64748b;">Assigned Service:</span> <span class="badge" style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:700;">${esc(cfg.assignedService)}</span></div>
            <div><span style="color: #64748b;">Auth Type:</span> <strong>${esc(cfg.authType)}</strong></div>
            <div><span style="color: #64748b;">Endpoint:</span> <code>${esc(cfg.baseUrl)}${esc(cfg.endpoint)}</code></div>
          </div>
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12.5px;">
              Verification Status: ${testPassed
                ? '<span style="color: #16a34a; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Verified via Live Probe</span>'
                : '<span style="color: #f59e0b; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation"></i> Not yet probed (or failed probe)</span>'}
            </div>
            <div style="font-size: 12px; color: #64748b;">
              Primary Route: <strong>${cfg.isPrimary ? 'Yes (Active Service Handler)' : 'Standby / Custom'}</strong>
            </div>
          </div>
        </div>
      `;
    }

    gatherFormData() {
      const baseUrl = document.getElementById('wiz-base-url')?.value?.trim() || '';
      const endpoint = document.getElementById('wiz-endpoint')?.value?.trim() || '';
      const fullEndpoint = (baseUrl && endpoint) ? `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}` : (baseUrl || endpoint);

      let customHeaders = null;
      try {
        const rawH = document.getElementById('wiz-custom-headers')?.value?.trim();
        if (rawH) customHeaders = JSON.parse(rawH);
      } catch (e) {}

      const category = document.getElementById('wiz-api-category')?.value || 'ai';
      const isAi = category === 'ai' || category === 'multilingual_ai';

      let aiConfig = null;
      if (isAi) {
        aiConfig = {
          modelName: document.getElementById('wiz-ai-model-name')?.value?.trim() || 'default-model',
          modelId: document.getElementById('wiz-ai-model-id')?.value?.trim() || 'default-model',
          maxTokens: Number(document.getElementById('wiz-ai-max-tokens')?.value) || 2048,
          temperature: Number(document.getElementById('wiz-ai-temperature')?.value) || 0.3,
          requestFormat: document.getElementById('wiz-ai-req-format')?.value || 'openai_standard',
          responsePath: document.getElementById('wiz-ai-resp-path')?.value?.trim() || 'choices[0].message.content',
          streamingSupport: false
        };
      }

      const allowLocalDev = document.getElementById('wiz-allow-dev-val')?.value === 'true';

      return {
        customApiId: this.editingCustomApiId || `capi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: document.getElementById('wiz-display-name')?.value?.trim() || 'Custom API',
        displayName: document.getElementById('wiz-display-name')?.value?.trim() || 'Custom API',
        providerName: document.getElementById('wiz-provider-name')?.value?.trim() || 'Custom Provider',
        category,
        providerWebsite: document.getElementById('wiz-provider-website')?.value?.trim() || '',
        docsUrl: document.getElementById('wiz-docs-url')?.value?.trim() || '',
        description: document.getElementById('wiz-description')?.value?.trim() || '',
        providerType: document.getElementById('wiz-provider-type')?.value || 'REST_JSON',
        baseUrl,
        endpoint,
        fullEndpoint,
        httpMethod: document.getElementById('wiz-http-method')?.value || 'POST',
        contentType: document.getElementById('wiz-content-type')?.value || 'application/json',
        timeoutMs: Number(document.getElementById('wiz-timeout')?.value) || 10000,
        retryLimit: Number(document.getElementById('wiz-retry')?.value) || 2,
        authType: document.getElementById('wiz-auth-type')?.value || 'BEARER_TOKEN',
        authHeaderName: document.getElementById('wiz-auth-header-name')?.value?.trim() || 'x-api-key',
        queryParamName: document.getElementById('wiz-auth-param-name')?.value?.trim() || 'key',
        clientId: document.getElementById('wiz-client-id')?.value?.trim() || '',
        customHeaders,
        allowLocalDev,
        aiConfig,
        assignedService: document.getElementById('wiz-service-assign')?.value || 'ai_assistant',
        isPrimary: document.getElementById('wiz-is-primary')?.checked || false,
        enableFallback: document.getElementById('wiz-enable-fallback')?.checked !== false
      };
    }

    // =========================================================================
    // 3. STEP 7: SAVE & ACTIVATE
    // =========================================================================

    async submitWizard(activateImmediately = false) {
      if (!this.store) return;
      const isAdmin = window.authService ? window.authService.isAdmin() : true;
      if (!isAdmin) {
        showToast('Unauthorized: Only Administrators can save or activate Custom APIs.', 'error');
        return;
      }

      const config = this.gatherFormData();
      const secretKey = document.getElementById('wiz-api-key')?.value?.trim() || null;

      config.enabled = activateImmediately;
      config.status = activateImmediately ? (this.lastTestResult?.success ? 'OPERATIONAL' : 'CONNECTED') : 'DRAFT';

      if (this.lastTestResult) {
        config.lastTested = this.lastTestResult.testedAt;
        config.lastLatencyMs = this.lastTestResult.latencyMs;
        config.lastStatusCode = this.lastTestResult.httpCode;
      }

      try {
        const res = await this.store.saveCustomApi(config, secretKey);
        if (res.success) {
          showToast(`Custom API "${config.name}" ${activateImmediately ? 'saved and activated' : 'saved as draft'}!`, 'success');
          this.closeBuilderWizard();
          this.renderCustomApisDashboard();
          if (typeof window.loadAdminApiMasterPanel === 'function') {
            window.loadAdminApiMasterPanel();
          }
        } else {
          showToast(`Save failed: ${res.message}`, 'error');
        }
      } catch (err) {
        showToast('Error saving custom API: ' + err.message, 'error');
      }
    }

    // =========================================================================
    // 4. "MY CUSTOM APIS" DASHBOARD TABLE & ACTIONS
    // =========================================================================

    async renderCustomApisDashboard() {
      const container = document.getElementById('custom-apis-dashboard-container');
      if (!container || !this.store) return;

      const apis = await this.store.getCustomApis();
      const countPill = document.getElementById('custom-apis-count-pill');
      if (countPill) countPill.innerText = `${apis.length} Custom Integrations`;

      if (apis.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 36px 20px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px;">
            <i class="fa-solid fa-puzzle-piece" style="font-size: 38px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
            <h4 style="color: #0b2545; font-size: 15px; margin: 0 0 6px 0;">No Custom APIs Created Yet</h4>
            <p style="color: #64748b; font-size: 13px; max-width: 480px; margin: 0 auto 16px auto;">
              Connect your own LLMs, local Ollama models, Twilio SMS gateways, or private database endpoints directly to JANASEVA services.
            </p>
            <button type="button" class="btn-cta-primary" onclick="window.JanasevaCustomApiManager.openBuilderWizard()" style="background: linear-gradient(135deg, #0f766e, #0d9488); border: none; padding: 8px 18px; font-size: 13px; border-radius: 6px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-plus-circle"></i>
              <span>+ CREATE MY OWN API</span>
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="directory-table-responsive">
          <table class="directory-table">
            <thead>
              <tr>
                <th>Custom API Provider</th>
                <th>Category &amp; Transport</th>
                <th>Target Endpoint</th>
                <th>Assigned Service</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Last Verified</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              ${apis.map(api => {
                const isOp = api.status === 'OPERATIONAL' || api.status === 'CONNECTED';
                const isDraft = api.status === 'DRAFT';
                const statusBadge = !api.enabled
                  ? '<span class="admin-tab-badge" style="background:#64748b;color:#fff;">Disabled</span>'
                  : isDraft
                  ? '<span class="admin-tab-badge" style="background:#f59e0b;color:#fff;">Draft</span>'
                  : isOp
                  ? '<span class="admin-tab-badge" style="background:#16a34a;color:#fff;">Operational</span>'
                  : '<span class="admin-tab-badge" style="background:#dc2626;color:#fff;">Error</span>';

                const fullUrl = api.fullEndpoint || `${api.baseUrl || ''}${api.endpoint || ''}`;
                const latency = api.lastLatencyMs ? `${api.lastLatencyMs} ms` : (api.latencyMs ? `${api.latencyMs} ms` : '--');
                const lastTested = api.lastTested ? new Date(api.lastTested).toLocaleTimeString() : 'Never';

                const icon = (api.category === 'ai' || api.category === 'multilingual_ai') ? 'fa-brain'
                  : api.category === 'email' ? 'fa-envelope'
                  : api.category === 'whatsapp' ? 'fa-brands fa-whatsapp'
                  : api.category === 'maps_gis' ? 'fa-map-location-dot'
                  : api.category === 'ocr' ? 'fa-file-lines'
                  : api.category === 'database' ? 'fa-database'
                  : 'fa-cube';

                const iconClass = icon.includes('fa-brands') ? icon : `fa-solid ${icon}`;

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 6px; background: #f0fdf4; color: #0f766e; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                          <i class="${iconClass}"></i>
                        </div>
                        <div>
                          <strong style="display: block; font-size: 13.5px; color: #0b2545;">${esc(api.name)}</strong>
                          <span style="font-size: 11.5px; color: #64748b;">${esc(api.providerName)} • <code>${esc(api.customApiId)}</code></span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge" style="background:#f1f5f9;color:#334155;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:700;">${esc(api.category.toUpperCase())}</span>
                      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${esc(api.httpMethod)} • ${esc(api.authType)}</div>
                    </td>
                    <td style="font-size: 12px; color: #334155; max-width: 200px; word-break: break-all;">
                      <code>${esc(fullUrl)}</code>
                    </td>
                    <td>
                      <span class="badge" style="background:#e0f2fe;color:#0369a1;padding:3px 7px;border-radius:4px;font-size:11.5px;font-weight:700;">
                        ${esc(api.assignedService)}
                      </span>
                      ${api.isPrimary ? '<span style="display:block;font-size:10.5px;color:#16a34a;font-weight:700;margin-top:2px;">★ Primary Handler</span>' : ''}
                    </td>
                    <td>${statusBadge}</td>
                    <td style="font-size: 12.5px; color: #475569;">${latency}</td>
                    <td style="font-size: 11.5px; color: #64748b;">${lastTested}</td>
                    <td>
                      <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
                        <button type="button" class="btn-table-action" onclick="window.JanasevaCustomApiManager.openBuilderWizard('${esc(api.customApiId)}')" title="Edit Configuration" style="padding: 4px 7px; font-size: 11.5px;">
                          <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn-table-action" onclick="window.JanasevaCustomApiManager.runDirectProbe('${esc(api.customApiId)}')" title="Ping Endpoint" style="padding: 4px 7px; font-size: 11.5px;">
                          <i class="fa-solid fa-bolt" style="color: #0284c7;"></i>
                        </button>
                        <button type="button" class="btn-table-action" onclick="window.JanasevaCustomApiManager.openKeyRotationModal('${esc(api.customApiId)}')" title="Rotate / Replace Key in Vault" style="padding: 4px 7px; font-size: 11.5px;">
                          <i class="fa-solid fa-key" style="color: #e65100;"></i>
                        </button>
                        <button type="button" class="btn-table-action" onclick="window.JanasevaCustomApiManager.toggleCustomApiActive('${esc(api.customApiId)}', ${Boolean(api.enabled)})" title="${api.enabled ? 'Pause API' : 'Activate API'}" style="padding: 4px 7px; font-size: 11.5px;">
                          <i class="fa-solid ${api.enabled ? 'fa-pause' : 'fa-play'}" style="color: ${api.enabled ? '#dc2626' : '#16a34a'};"></i>
                        </button>
                        <button type="button" class="btn-table-action" onclick="window.JanasevaCustomApiManager.duplicateCustomApi('${esc(api.customApiId)}')" title="Duplicate API" style="padding: 4px 7px; font-size: 11.5px;">
                          <i class="fa-solid fa-copy"></i>
                        </button>
                        <button type="button" class="btn-table-action btn-icon-danger" onclick="window.JanasevaCustomApiManager.deleteCustomApiWithConfirm('${esc(api.customApiId)}', '${esc(api.name)}')" title="Delete API" style="padding: 4px 7px; font-size: 11.5px;">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    async runDirectProbe(customApiId) {
      if (!this.store) return;
      const api = await this.store.getCustomApi(customApiId);
      if (!api) return;

      showToast(`Pinging ${api.name}...`, 'info');
      try {
        const res = await this.store.testCustomApiConnection(api);
        api.lastTested = res.testedAt;
        api.lastLatencyMs = res.latencyMs;
        api.lastStatusCode = res.httpCode;
        api.status = res.success ? 'OPERATIONAL' : 'ERROR';
        await this.store.saveCustomApi(api);

        if (res.success) {
          showToast(`[${api.name}] Connection verified: ${res.latencyMs} ms (HTTP ${res.httpCode})`, 'success');
        } else {
          showToast(`[${api.name}] Test failed: ${res.message}`, 'error');
        }
        this.renderCustomApisDashboard();
        if (typeof window.loadAdminApiMasterPanel === 'function') {
          window.loadAdminApiMasterPanel();
        }
      } catch (e) {
        showToast('Probe error: ' + e.message, 'error');
      }
    }

    async toggleCustomApiActive(customApiId, currentEnabled) {
      if (!this.store) return;
      const isAdmin = window.authService ? window.authService.isAdmin() : true;
      if (!isAdmin) {
        showToast('Unauthorized: Only Administrators can toggle API status.', 'error');
        return;
      }

      try {
        const nextState = !currentEnabled;
        await this.store.toggleCustomApi(customApiId, nextState);
        showToast(`API integration ${nextState ? 'activated' : 'paused'}.`, 'success');
        this.renderCustomApisDashboard();
        if (typeof window.loadAdminApiMasterPanel === 'function') {
          window.loadAdminApiMasterPanel();
        }
      } catch (err) {
        showToast('Failed to toggle API: ' + err.message, 'error');
      }
    }

    async duplicateCustomApi(customApiId) {
      if (!this.store) return;
      try {
        const orig = await this.store.getCustomApi(customApiId);
        if (!orig) return;

        const cloned = JSON.parse(JSON.stringify(orig));
        cloned.customApiId = `capi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        cloned.name = `${orig.name} (Copy)`;
        cloned.displayName = `${orig.displayName || orig.name} (Copy)`;
        cloned.enabled = false;
        cloned.isPrimary = false;
        cloned.status = 'DRAFT';

        await this.store.saveCustomApi(cloned);
        showToast(`Duplicated as "${cloned.name}".`, 'success');
        this.renderCustomApisDashboard();
      } catch (err) {
        showToast('Duplicate error: ' + err.message, 'error');
      }
    }

    async deleteCustomApiWithConfirm(customApiId, name) {
      if (!confirm(`Are you sure you want to permanently delete custom API "${name}"?\n\nIf this API was assigned as a primary service handler, the system will seamlessly revert to the default JANASEVA provider.`)) {
        return;
      }

      try {
        await this.store.deleteCustomApi(customApiId);
        showToast(`Custom API "${name}" deleted.`, 'info');
        this.renderCustomApisDashboard();
        if (typeof window.loadAdminApiMasterPanel === 'function') {
          window.loadAdminApiMasterPanel();
        }
      } catch (err) {
        showToast('Delete error: ' + err.message, 'error');
      }
    }

    // =========================================================================
    // 5. API KEY VAULT CREDENTIAL ROTATION
    // =========================================================================

    async openKeyRotationModal(customApiId) {
      if (!this.store) return;
      const api = await this.store.getCustomApi(customApiId);
      if (!api) return;

      const modal = document.getElementById('modal-api-vault-rotate');
      if (!modal) return;

      document.getElementById('rotate-api-id').value = customApiId;
      document.getElementById('rotate-api-name-display').innerText = api.name;
      document.getElementById('rotate-current-masked').innerText = api.maskedKeyPreview || '••••••••';
      document.getElementById('rotate-new-key').value = '';
      document.getElementById('rotate-reason').value = 'Scheduled production key rotation';

      modal.style.display = 'flex';
    }

    closeKeyRotationModal() {
      const modal = document.getElementById('modal-api-vault-rotate');
      if (modal) modal.style.display = 'none';
    }

    async submitKeyRotation(event) {
      if (event) event.preventDefault();
      const customApiId = document.getElementById('rotate-api-id')?.value;
      const newKey = document.getElementById('rotate-new-key')?.value?.trim();
      const reason = document.getElementById('rotate-reason')?.value?.trim() || 'Key rotated by administrator';
      const expiry = document.getElementById('rotate-expiry')?.value || '';

      if (!newKey) {
        showToast('Please enter the replacement API key.', 'warning');
        return;
      }

      try {
        await this.store.rotateCustomApiKey(customApiId, newKey, reason, expiry);
        showToast('API credential rotated and encrypted in Vault successfully!', 'success');
        this.closeKeyRotationModal();
        this.renderCustomApisDashboard();
      } catch (err) {
        showToast('Rotation failed: ' + err.message, 'error');
      }
    }

    // =========================================================================
    // 6. HOW TO CONNECT MY API DOCUMENTATION GUIDE
    // =========================================================================

    renderDocGuide() {
      const container = document.getElementById('api-doc-guide-container');
      if (!container) return;

      const guides = [
        {
          key: 'gemini',
          title: 'Google Gemini 2.5 Flash / Pro',
          badge: 'AI Assistant & Multilingual',
          icon: 'fa-brain',
          color: '#0f766e',
          portalUrl: 'https://aistudio.google.com/app/apikey',
          docUrl: 'https://ai.google.dev/docs',
          summary: 'Obtain an API key from Google AI Studio. Uses HTTP header `x-goog-api-key` or query parameter `key`. Endpoint is `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.',
          authType: 'API_KEY_HEADER (x-goog-api-key)'
        },
        {
          key: 'openai',
          title: 'OpenAI GPT-4o / GPT-4o Mini',
          badge: 'AI Assistant',
          icon: 'fa-robot',
          color: '#10a37f',
          portalUrl: 'https://platform.openai.com/api-keys',
          docUrl: 'https://platform.openai.com/docs/api-reference/chat',
          summary: 'Generate an API secret key (`sk-...`). Standard Bearer Token authentication. Base URL is `https://api.openai.com/v1`, Endpoint `/chat/completions`.',
          authType: 'BEARER_TOKEN (Authorization: Bearer sk-...)'
        },
        {
          key: 'groq',
          title: 'Groq Cloud (DeepSeek R1 & Llama 3.3)',
          badge: 'Ultra-Fast AI',
          icon: 'fa-bolt',
          color: '#f97316',
          portalUrl: 'https://console.groq.com/keys',
          docUrl: 'https://docs.groq.com/docs/openai',
          summary: 'Generates responses in under 200ms. Fully OpenAI-compatible. Base URL `https://api.groq.com/openai/v1`, model `deepseek-r1-distill-llama-70b`.',
          authType: 'BEARER_TOKEN (Authorization: Bearer gsk_...)'
        },
        {
          key: 'anthropic',
          title: 'Anthropic Claude 3.5 Sonnet',
          badge: 'Nuanced Civic AI',
          icon: 'fa-message',
          color: '#d97706',
          portalUrl: 'https://console.anthropic.com/settings/keys',
          docUrl: 'https://docs.anthropic.com/en/api/getting-started',
          summary: 'Requires `x-api-key` header and custom header `anthropic-version: 2023-06-01`. Endpoint `https://api.anthropic.com/v1/messages`.',
          authType: 'API_KEY_HEADER (x-api-key)'
        },
        {
          key: 'ollama',
          title: 'Local Ollama / Self-Hosted LLM',
          badge: 'Zero-Cost Offline AI',
          icon: 'fa-server',
          color: '#475569',
          portalUrl: 'https://ollama.com/download',
          docUrl: 'https://github.com/ollama/ollama/blob/main/docs/openai.md',
          summary: 'Run Llama 3 or DeepSeek on the Panchayat local computer or private network. Uses `http://localhost:11434/v1/chat/completions` with No Auth and Development Mode enabled.',
          authType: 'NO_AUTH (Local Dev Exception)'
        },
        {
          key: 'sendgrid',
          title: 'SendGrid Email API',
          badge: 'Grievance Notifications',
          icon: 'fa-envelope',
          color: '#0284c7',
          portalUrl: 'https://app.sendgrid.com/settings/api_keys',
          docUrl: 'https://docs.sendgrid.com/api-reference/mail-send',
          summary: 'Automate citizen email receipts. Base URL `https://api.sendgrid.com/v3`, Endpoint `/mail/send` using Bearer Token (`SG...`).',
          authType: 'BEARER_TOKEN (Authorization: Bearer SG...)'
        },
        {
          key: 'twilio_whatsapp',
          title: 'Twilio WhatsApp Business API',
          badge: 'Citizen WhatsApp Broadcasts',
          icon: 'fa-brands fa-whatsapp',
          color: '#16a34a',
          portalUrl: 'https://console.twilio.com',
          docUrl: 'https://www.twilio.com/docs/whatsapp/quickstart',
          summary: 'Dispatches complaint acknowledgment receipts to citizens via WhatsApp. Uses Basic Authentication with Account SID and Auth Token.',
          authType: 'BASIC_AUTH (Account SID + Auth Token)'
        }
      ];

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${guides.map((g, idx) => `
            <div class="portal-card" style="margin: 0; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="document.getElementById('guide-body-${idx}').style.display = document.getElementById('guide-body-${idx}').style.display === 'none' ? 'block' : 'none';">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 32px; height: 32px; border-radius: 6px; background: #f1f5f9; color: ${g.color}; display: flex; align-items: center; justify-content: center; font-size: 15px;">
                    <i class="${g.icon.includes('fa-brands') ? g.icon : `fa-solid ${g.icon}`}"></i>
                  </div>
                  <div>
                    <strong style="color: #0b2545; font-size: 13.5px;">${esc(g.title)}</strong>
                    <span class="badge" style="background: rgba(15,118,110,0.1); color: #0f766e; font-size: 10.5px; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-left: 6px;">${esc(g.badge)}</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <button type="button" class="btn-table-action" onclick="event.stopPropagation(); window.JanasevaCustomApiManager.openBuilderWizard(null, '${g.key}')" style="background: #f0fdf4; color: #166534; border-color: #bbf7d0; font-size: 11.5px; padding: 4px 10px;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Use Template
                  </button>
                  <i class="fa-solid fa-chevron-down" style="color: #94a3b8; font-size: 12px;"></i>
                </div>
              </div>
              <div id="guide-body-${idx}" style="display: none; padding: 0 18px 16px 18px; border-top: 1px solid #f1f5f9; font-size: 12.5px; color: #475569; line-height: 1.55;">
                <p style="margin: 10px 0 8px 0;">${esc(g.summary)}</p>
                <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px;">
                  <span><strong>Auth:</strong> <code>${esc(g.authType)}</code></span>
                  <span><a href="${g.portalUrl}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: none;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Get API Key</a></span>
                  <span><a href="${g.docUrl}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: none;"><i class="fa-solid fa-book"></i> Official Docs</a></span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  window.JanasevaCustomApiManager = new JanasevaCustomApiManager();
})(window);
