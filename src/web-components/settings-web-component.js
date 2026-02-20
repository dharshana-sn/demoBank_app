class SettingsWebComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Inter', sans-serif;
          color: #1e293b;
        }
        .settings-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .setting-group {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .setting-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .label { font-weight: 600; font-size: 0.95rem; }
        .description { font-size: 0.85rem; color: #64748b; }
        
        /* Toggle Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px; width: 18px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider { background-color: #2563eb; }
        input:checked + .slider:before { transform: translateX(20px); }

        /* Form Controls */
        input[type="text"], input[type="range"] {
          width: 100%;
          margin-top: 8px;
        }
        
        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: 0.2s;
        }
        .btn-primary { background: #2563eb; color: white; }
        .btn-primary:hover { background: #1d4ed8; }
        
        .api-key-box {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.85rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          border: 1px dashed #cbd5e1;
        }

        /* Modal Simulation */
        #passwordModal {
          display: none;
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
          z-index: 1000;
          width: 300px;
        }
        .overlay {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
      </style>
      
      <div class="settings-container">
        <div class="setting-group">
          <div class="setting-header">
            <div>
              <div class="label">Dark Mode</div>
              <div class="description">Enable dark theme across the application.</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="darkModeToggle">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-header">
            <div>
              <div class="label">Email Notifications</div>
              <div class="description">Receive weekly transaction summaries.</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="notifToggle" checked>
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-group">
          <div class="label">Transaction Alert Threshold</div>
          <div class="description">Notify me for transactions above: $<span id="thresholdVal">500</span></div>
          <input type="range" id="thresholdSlider" min="0" max="5000" step="100" value="500">
        </div>

        <div class="setting-group">
          <div class="label">API Access Key</div>
          <div class="description">Use this key for programmatic account access.</div>
          <div class="api-key-box">
            <span id="apiKey">sk_test_51...xy92</span>
            <button class="btn btn-primary" id="genKeyBtn" style="font-size: 0.75rem">Generate New</button>
          </div>
        </div>

        <div class="setting-group" style="border: none">
          <button class="btn btn-primary" id="openPwdBtn">Change Password</button>
          <button class="btn" style="background: #ef4444; color: white; margin-left: 8px">Disable 2FA</button>
        </div>
      </div>

      <div class="overlay" id="modalOverlay"></div>
      <div id="passwordModal">
        <div class="label" style="margin-bottom: 16px">Update Password</div>
        <input type="text" placeholder="New Password" style="margin-bottom: 12px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <button class="btn" id="closePwdBtn">Cancel</button>
          <button class="btn btn-primary">Save</button>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const slider = this.shadowRoot.getElementById('thresholdSlider');
    const valLabel = this.shadowRoot.getElementById('thresholdVal');
    slider.addEventListener('input', (e) => {
      valLabel.textContent = e.target.value;
    });

    const openBtn = this.shadowRoot.getElementById('openPwdBtn');
    const closeBtn = this.shadowRoot.getElementById('closePwdBtn');
    const modal = this.shadowRoot.getElementById('passwordModal');
    const overlay = this.shadowRoot.getElementById('modalOverlay');

    const darkModeToggle = this.shadowRoot.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('change', (e) => {
      const isDark = e.target.checked;
      this.dispatchEvent(new CustomEvent('theme-change', {
        detail: { isDark },
        bubbles: true,
        composed: true
      }));
    });

    openBtn.addEventListener('click', () => {
      modal.style.display = 'block';
      overlay.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      overlay.style.display = 'none';
    });
  }
}

customElements.define('settings-web-component', SettingsWebComponent);
