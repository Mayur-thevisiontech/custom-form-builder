(function () {
  const initForms = async () => {
    // Check if the app is globally enabled via the App Embed toggle
    if (!window.shopifyFormBuilderEnabled) {
      console.log('Custom Form Builder is currently disabled in Theme App Embeds.');
      const containers = document.querySelectorAll('.custom-form-builder-container');
      containers.forEach(container => {
        container.innerHTML = `
          <div style="background-color: #fff4e5; border: 1px solid #ffa117; padding: 20px; border-radius: 8px; color: #664d03; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center;  margin: 20px auto;">
            <div style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">Setup Required</div>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              To display your form, please <b>Enable the Form Builder Embed</b> in your Shopify Theme Settings and then refresh this screen.
            </p>
          </div>
        `;
      });
      return;
    }

    const containers = document.querySelectorAll('.custom-form-builder-container');

    for (const container of containers) {
      const formId = container.dataset.formId;
      const shop = container.dataset.shop;

      if (!formId) continue;

      try {
        let scriptOrigin = 'https://app-applications.myshopify.com';
        const scripts = document.getElementsByTagName('script');
        for (let s of scripts) {
          if (s.src && s.src.includes('form-renderer.js') && !s.src.includes('cdn.shopify.com')) {
            scriptOrigin = new URL(s.src).origin;
            break;
          }
        }

        const proxyUrl = `/apps/custom-form-builder/api/form/${formId}`;
        const directUrl = `${scriptOrigin}/api/form/${formId}`;
        const localUrl = `/api/form/${formId}`;

        console.log('--- Custom Form Builder Debug ---');
        console.log('Form ID:', formId);
        console.log('Script Origin:', scriptOrigin);

        let response;
        // Attempt 1: App Proxy (Storefront)
        try {
          console.log(`Attempt 1: Fetching via Proxy (${proxyUrl})...`);
          response = await fetch(proxyUrl);
        } catch (e) { console.warn('Proxy fetch network error:', e); }

        // Attempt 2: Direct URL (Cross-domain / Editor)
        if (!response || !response.ok) {
          try {
            console.log(`Attempt 2: Fetching via Direct URL (${directUrl})...`);
            response = await fetch(directUrl);
          } catch (e) { console.warn('Direct fetch network error:', e); }
        }

        // Attempt 3: Local Path (App domain)
        if (!response || !response.ok) {
          try {
            console.log(`Attempt 3: Fetching via Local Path (${localUrl})...`);
            response = await fetch(localUrl);
          } catch (e) { console.warn('Local fetch network error:', e); }
        }

        if (!response || !response.ok) {
          const status = response ? response.status : 'Network Error';
          let errorMsg = `Server connection failed (${status})`;
          try {
            const errorData = await response.json();
            if (errorData.error) errorMsg = errorData.error;
          } catch (e) { }
          throw new Error(errorMsg);
        }

        const form = await response.json();
        console.log('Form data loaded:', form);
        renderForm(container, form, formId);
      } catch (error) {
        console.error('Error loading form:', error);
        container.innerHTML = `
          <div style="background-color: #f8d7da; border: 1px solid #f5c2c7; padding: 20px; border-radius: 8px; color: #842029; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; margin: 20px auto;">
            <div style="font-weight: 700; font-size: 18px; margin-bottom: 8px;">⚠️ Form Not Found</div>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">
              The form with ID <b>"${formId}"</b> could not be loaded. Please verify the ID in your App Dashboard and ensure the form is published.
            </p>
          </div>
        `;
      }
    }
  };

  const renderForm = (container, form, formId) => {
    const { schema, settings } = form;
    const submitText = settings.submitText || 'Submit';
    const submitColor = settings.submitColor || '#008060';
    
    // Customization Settings
    const layoutStyle = settings.layoutStyle || 'clean-silhouette';
    const alignment = settings.alignment || 'center';

    let fieldsHtml = '';
    schema.forEach(field => {
      const fieldWidth = field.width || '100';
      const style = `width: ${fieldWidth}%; display: inline-block; padding: 0 10px; box-sizing: border-box; margin-bottom: 20px; vertical-align: top;`;

      fieldsHtml += `
        <div class="cfb-field" style="${style}">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: #333;">
            ${field.label} ${field.required ? '<span style="color: #d7373d;">*</span>' : ''}
          </label>
          <input type="${field.type}" 
                 name="${field.id}" 
                 placeholder="${field.placeholder || ''}" 
                 ${field.required ? 'required' : ''}
                 style="width: 100%; padding: 12px; border: 1px solid #d1d1d1; border-radius: 6px; font-size: 14px; box-sizing: border-box; transition: border-color 0.2s;"
                 onfocus="this.style.borderColor='#008060'; this.style.outline='none';"
                 onblur="this.style.borderColor='#d1d1d1';">
          ${field.helpText ? `<div style="color: #6d7175; font-size: 12px; margin-top: 4px;">${field.helpText}</div>` : ''}
        </div>
      `;
    });

    // Style logic
    let containerStyle = `
      max-width: 600px; 
      display: flex; 
      flex-wrap: wrap; 
      margin-left: ${alignment === 'center' || alignment === 'right' ? 'auto' : '0'};
      margin-right: ${alignment === 'center' || alignment === 'left' ? 'auto' : '0'};
      padding: 32px 22px;
      border-radius: 12px;
      box-sizing: border-box;
      transition: all 0.3s ease;
    `;

    if (layoutStyle === 'clean-silhouette') {
      containerStyle += 'border: 1px solid #e1e3e5; background: #ffffff;';
    } else if (layoutStyle === 'classic-canvas') {
      containerStyle += 'border: 1px solid #e1e3e5; background: #f9fafb;';
    } else if (layoutStyle === 'modern-floating') {
      containerStyle += 'border: none; background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.1);';
    }

    container.innerHTML = `
      <form class="cfb-form" data-form-id="${formId}" style="${containerStyle}">
        <div style="width: 100%; padding: 0 10px; box-sizing: border-box; margin-bottom: 10px;">
          <h2 style="margin-bottom: 5px; font-size: 20px; font-weight: 700;">${form.title}</h2>
        </div>
        ${fieldsHtml}
        <div style="width: 100%; padding: 0 10px; box-sizing: border-box; margin-top: 10px;">
          <button type="submit" style="background-color: ${submitColor}; color: white; padding: 14px 24px; border: none; border-radius: 6px; cursor: pointer; width: 100%; font-weight: 600; font-size: 16px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            ${submitText}
          </button>
        </div>
        <div class="cfb-message" style="margin-top: 20px; padding: 0 10px; width: 100%; box-sizing: border-box; display: none; font-weight: 500;"></div>
      </form>
    `;

    const formElement = container.querySelector('form');
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(formElement);
      const data = Object.fromEntries(formData.entries());
      const messageDiv = container.querySelector('.cfb-message');

      try {
        let scriptOrigin = 'https://app-applications.myshopify.com';
        const scripts = document.getElementsByTagName('script');
        for (let s of scripts) {
          if (s.src && s.src.includes('form-renderer.js') && !s.src.includes('cdn.shopify.com')) {
            scriptOrigin = new URL(s.src).origin;
            break;
          }
        }

        let response;
        try {
          response = await fetch(`/apps/custom-form-builder/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formId, data })
          });
        } catch (e) {
          console.warn('Proxy submission network error:', e);
        }

        if (!response || !response.ok) {
          console.log('Proxy submission failed, attempting direct submission...');
          response = await fetch(`${scriptOrigin}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formId, data })
          });
        }

        if (response.ok) {
          messageDiv.textContent = 'Success! Your form has been submitted.';
          messageDiv.style.color = 'green';
          messageDiv.style.display = 'block';
          formElement.reset();
        } else {
          throw new Error('Submission failed');
        }
      } catch (error) {
        console.error('Submission error:', error);
        messageDiv.textContent = 'Something went wrong. Please try again.';
        messageDiv.style.color = 'red';
        messageDiv.style.display = 'block';
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
})();
