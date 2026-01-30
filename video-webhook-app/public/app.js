/**
 * Video Webhook Application
 * Handles form submission, loading states, and API communication
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('webhookForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusBadge = document.getElementById('statusBadge');
    const responseSection = document.getElementById('responseSection');
    const responseBadge = document.getElementById('responseBadge');
    const responseContent = document.getElementById('responseContent');
    const copyBtn = document.getElementById('copyBtn');
    const videoUrlInput = document.getElementById('videoUrl');

    /**
     * Set loading state
     */
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.classList.add('loading');
            statusBadge.classList.add('loading');
            statusBadge.querySelector('span:last-child').textContent = 'Procesando...';
            submitBtn.disabled = true;
        } else {
            submitBtn.classList.remove('loading');
            statusBadge.classList.remove('loading');
            statusBadge.querySelector('span:last-child').textContent = 'Ready';
            submitBtn.disabled = false;
        }
    }

    /**
     * Set error state
     */
    function setError(message) {
        statusBadge.classList.remove('loading');
        statusBadge.classList.add('error');
        statusBadge.querySelector('span:last-child').textContent = 'Error';

        showResponse({ error: message }, false);

        // Reset after 3 seconds
        setTimeout(() => {
            statusBadge.classList.remove('error');
            statusBadge.querySelector('span:last-child').textContent = 'Ready';
        }, 3000);
    }

    /**
     * Show response in the response section
     */
    function showResponse(data, isSuccess) {
        responseSection.classList.add('visible');
        responseBadge.textContent = isSuccess ? 'Éxito' : 'Error';
        responseBadge.className = 'response-badge ' + (isSuccess ? 'success' : 'error');
        responseContent.textContent = JSON.stringify(data, null, 2);
    }

    /**
     * Validate video URL
     */
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return ['http:', 'https:'].includes(url.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Handle form submission
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const videoUrl = videoUrlInput.value.trim();

        // Client-side validation
        if (!videoUrl) {
            setError('Por favor ingresa una URL de video');
            return;
        }

        if (!isValidUrl(videoUrl)) {
            setError('La URL ingresada no es válida');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showResponse(data.data || data, true);
                statusBadge.querySelector('span:last-child').textContent = 'Completado';
            } else {
                setError(data.error || 'Error al procesar la solicitud');
            }
        } catch (error) {
            console.error('Request failed:', error);
            setError('Error de conexión. Verifica tu red.');
        } finally {
            setLoading(false);
        }
    });

    /**
     * Copy response to clipboard
     */
    copyBtn.addEventListener('click', async () => {
        const text = responseContent.textContent;

        try {
            await navigator.clipboard.writeText(text);

            // Visual feedback
            copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
            copyBtn.style.color = 'var(--success)';

            setTimeout(() => {
                copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        `;
                copyBtn.style.color = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    });

    /**
     * Input animation on focus
     */
    videoUrlInput.addEventListener('focus', () => {
        videoUrlInput.parentElement.classList.add('focused');
    });

    videoUrlInput.addEventListener('blur', () => {
        videoUrlInput.parentElement.classList.remove('focused');
    });
});
