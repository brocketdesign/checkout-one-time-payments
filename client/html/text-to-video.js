document.addEventListener('DOMContentLoaded', () => {
    // Base elements
    const t2vPrompt = document.getElementById('t2vPrompt');
    const t2vPromptCharCount = document.getElementById('t2vPromptCharCount');
    const t2vModelSelect = document.getElementById('t2vModelSelect');
    const generateTextToVideoButton = document.getElementById('generateTextToVideoButton');
    const t2vStatus = document.getElementById('t2vStatus');
    const t2vResultSection = document.getElementById('t2vResultSection');
    const t2vGeneratedVideo = document.getElementById('t2vGeneratedVideo');
    const t2vSampleVideoPlaceholder = document.getElementById('t2vSampleVideoPlaceholder');
    const t2vDownloadVideoLink = document.getElementById('t2vDownloadVideoLink');
    const t2vSampleGallery = document.getElementById('t2vSampleGallery');
    const t2vNegativePrompt = document.getElementById('t2vNegativePrompt');
    const t2vNegativePromptCharCount = document.getElementById('t2vNegativePromptCharCount');
    const t2vSkipPayment = document.getElementById('t2vSkipPayment');
    const t2vPaymentStatus = document.getElementById('t2vPaymentStatus');
    const t2vSkipPaymentContainer = document.getElementById('t2vSkipPaymentContainer');
    const t2vGuidanceScale = document.getElementById('t2vGuidanceScale');
    const t2vGuidanceScaleValue = document.getElementById('t2vGuidanceScaleValue');
    const t2vMode = document.getElementById('t2vMode');
    const t2vDuration = document.getElementById('t2vDuration');

    const t = (key, fallback) => translationsObj && translationsObj[key] ? translationsObj[key] : fallback;

    // Initialize enhanced form elements if external libraries are loaded
    initializeEnhancedFormElements();

    // Check URL parameters for payment status and task ID
    checkUrlParameters();

    // Handle payment skip checkbox
    const urlParams = new URLSearchParams(window.location.search);
    const forceSkipPayment = urlParams.get('skip_payment') === 'true';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.');
    
    if ((isLocal || forceSkipPayment) && t2vSkipPaymentContainer && t2vSkipPayment && t2vPaymentStatus) {
        t2vSkipPaymentContainer.style.display = 'block';
        
        // Default to checked on localhost or if URL parameter is set
        t2vSkipPayment.checked = isLocal || forceSkipPayment;

        const updatePaymentStatus = () => {
            if (t2vSkipPayment.checked) {
                t2vPaymentStatus.classList.remove('warning');
                t2vPaymentStatus.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>' + t('payment_skipped_local', 'Payment skipped (local)') + '</span>';
            } else {
                t2vPaymentStatus.classList.add('warning');
                t2vPaymentStatus.innerHTML = '<i class="bi bi-info-circle-fill"></i><span>' + t('payment_required', 'Payment required') + '</span>';
            }
        };

        t2vSkipPayment.addEventListener('change', updatePaymentStatus);
        updatePaymentStatus();
    } else {
        if (t2vSkipPaymentContainer) {
            t2vSkipPaymentContainer.style.display = 'none';
        }
        if (t2vPaymentStatus) {
            t2vPaymentStatus.classList.add('warning');
            t2vPaymentStatus.innerHTML = '<i class="bi bi-info-circle-fill"></i><span>' + t('payment_required', 'Payment required') + '</span>';
        }
    }

    if (t2vPrompt) {
        t2vPrompt.addEventListener('input', () => {
            const count = t2vPrompt.value.length;
            if (t2vPromptCharCount) {
                t2vPromptCharCount.textContent = count;
            }
        });
    }

    if (t2vNegativePrompt && t2vNegativePromptCharCount) {
        t2vNegativePrompt.addEventListener('input', () => {
            const count = t2vNegativePrompt.value.length;
            t2vNegativePromptCharCount.textContent = count;
        });
    }

    if (t2vModelSelect) {
        t2vModelSelect.addEventListener('change', () => {
            // For now, only Kling model is supported
        });
    }

    function showStatus(message, type = 'info', isLoading = false) {
        if (!t2vStatus) return;
        let iconHtml = '';
        if (isLoading) {
            iconHtml = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>';
        }
        t2vStatus.innerHTML = `<div class="alert alert-${type} d-flex align-items-center">${iconHtml}<span>${message}</span></div>`;
    }

    function clearStatus() {
        if (t2vStatus) t2vStatus.innerHTML = '';
    }

    function initializeEnhancedFormElements() {
        if (typeof Choices !== 'undefined') {
            if (t2vModelSelect) {
                new Choices(t2vModelSelect, {
                    searchEnabled: false,
                    itemSelectText: '',
                    allowHTML: false
                });
            }

            if (t2vMode) {
                new Choices(t2vMode, {
                    searchEnabled: false,
                    itemSelectText: '',
                    allowHTML: false
                });
            }

            if (t2vDuration) {
                new Choices(t2vDuration, {
                    searchEnabled: false,
                    itemSelectText: '',
                    allowHTML: false
                });
            }
        }

        if (typeof noUiSlider !== 'undefined') {
            const guidanceScaleSlider = document.getElementById('t2vGuidanceScaleSlider');
            if (guidanceScaleSlider && t2vGuidanceScaleValue) {
                noUiSlider.create(guidanceScaleSlider, {
                    start: [0.5],
                    connect: [true, false],
                    range: {
                        'min': 0,
                        'max': 1
                    },
                    step: 0.1,
                    tooltips: false,
                    format: {
                        to: function (value) {
                            return parseFloat(value).toFixed(1);
                        },
                        from: function (value) {
                            return parseFloat(value);
                        }
                    }
                });

                guidanceScaleSlider.noUiSlider.on('update', function (values, handle) {
                    const value = values[handle];
                    t2vGuidanceScaleValue.textContent = value;
                    if (t2vGuidanceScale) {
                        t2vGuidanceScale.value = value;
                    }
                });

                // Set initial value
                t2vGuidanceScaleValue.textContent = '0.5';
                if (t2vGuidanceScale) {
                    t2vGuidanceScale.value = '0.5';
                }
            }
        }
    }

    if (generateTextToVideoButton) {
        generateTextToVideoButton.addEventListener('click', async () => {
            const promptText = t2vPrompt ? t2vPrompt.value.trim() : '';
            if (!promptText) {
                showStatus(t('prompt_required_t2v', 'Prompt is required'), 'danger');
                return;
            }

            const model = t2vModelSelect ? t2vModelSelect.value : 'kling-v1.6-t2v';
            const negativePrompt = t2vNegativePrompt ? t2vNegativePrompt.value.trim() : '';
            const mode = t2vMode ? t2vMode.value : 'Standard';
            const duration = t2vDuration ? parseInt(t2vDuration.value, 10) : 5;
            const guidanceScale = t2vGuidanceScale ? parseFloat(t2vGuidanceScale.value) : 0.5;
            
            let skipPayment = false;
            const urlParams = new URLSearchParams(window.location.search);
            const forceSkipPayment = urlParams.get('skip_payment') === 'true';
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.');
            
            if (isLocal || forceSkipPayment) {
                skipPayment = t2vSkipPayment ? t2vSkipPayment.checked : false;
            }

            showStatus(t('generating_video_t2v', 'Generating video, please wait... This may take a few minutes.'), 'info', true);
            if (t2vResultSection) t2vResultSection.style.display = 'none';
            if (t2vGeneratedVideo) t2vGeneratedVideo.src = '';
            if (t2vSampleVideoPlaceholder) t2vSampleVideoPlaceholder.style.display = 'block';
            if (t2vDownloadVideoLink) t2vDownloadVideoLink.style.display = 'none';
            generateTextToVideoButton.disabled = true;

            const requestData = {
                prompt: promptText,
                model_name: model,
                negative_prompt: negativePrompt,
                mode: mode,
                duration: duration,
                guidance_scale: guidanceScale,
                skipPayment: skipPayment
            };

            try {
                const response = await fetch('/api/text-to-video', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to start video generation');
                }

                if (result.require_payment && !skipPayment) {
                    // Redirect to payment
                    window.location.href = `/api/t2v-create-checkout-session?task_id=${result.task_id}`;
                    return;
                }

                // Start polling for results
                pollForT2VResult(result.task_id);

            } catch (error) {
                console.error('Error generating video:', error);
                showStatus(t('error_generating_video_t2v', 'Error generating video: ') + error.message, 'danger');
                generateTextToVideoButton.disabled = false;
            }
        });
    }

    async function pollForT2VResult(taskId) {
        // Disable the generate button during processing
        if (generateTextToVideoButton) {
            generateTextToVideoButton.disabled = true;
        }
        
        // Hide any result that might be showing
        if (t2vResultSection) {
            t2vResultSection.style.display = 'none';
        }
        
        // Show the placeholder
        if (t2vSampleVideoPlaceholder) {
            t2vSampleVideoPlaceholder.style.display = 'block';
        }
        
        // Reset video source
        if (t2vGeneratedVideo) {
            t2vGeneratedVideo.src = '';
        }
        
        // Hide download link
        if (t2vDownloadVideoLink) {
            t2vDownloadVideoLink.style.display = 'none';
        }

        const tempId = 'temp_' + Math.random().toString(36).substring(2, 15);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/text-to-video-ws?task_id=${taskId}&tempId=${tempId}`;
        console.log('Connecting to WebSocket:', wsUrl);

        let ws = new WebSocket(wsUrl);
        let fallbackPolling = false;
        let wsConnected = false;

        ws.onopen = () => {
            console.log('WebSocket connected for text-to-video');
            wsConnected = true;
            showStatus(t('processing_video_t2v', 'Processing your video...'), 'info', true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message:', data);

                if (data.status === 'completed' && data.video_url) {
                    // Video generation completed
                    showStatus(t('video_ready_t2v', 'Video generation completed!'), 'success');
                    
                    if (t2vGeneratedVideo) {
                        t2vGeneratedVideo.src = data.video_url;
                        t2vGeneratedVideo.load();
                    }
                    
                    if (t2vResultSection) {
                        t2vResultSection.style.display = 'block';
                    }
                    
                    if (t2vSampleVideoPlaceholder) {
                        t2vSampleVideoPlaceholder.style.display = 'none';
                    }
                    
                    if (t2vDownloadVideoLink) {
                        t2vDownloadVideoLink.href = data.video_url;
                        t2vDownloadVideoLink.style.display = 'block';
                    }
                    
                    if (generateTextToVideoButton) {
                        generateTextToVideoButton.disabled = false;
                    }
                    
                    ws.close();
                    
                } else if (data.status === 'failed') {
                    showStatus(t('video_generation_failed_t2v', 'Video generation failed: ') + (data.error || 'Unknown error'), 'danger');
                    if (generateTextToVideoButton) {
                        generateTextToVideoButton.disabled = false;
                    }
                    ws.close();
                    
                } else if (data.progress !== undefined) {
                    showStatus(t('processing_progress_t2v', 'Processing... ') + data.progress + '%', 'info', true);
                }
                
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (!fallbackPolling) {
                fallbackPolling = true;
                fallbackToPolling(taskId);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket closed');
            if (!wsConnected && !fallbackPolling) {
                fallbackPolling = true;
                fallbackToPolling(taskId);
            }
        };

        const fallbackToPolling = (taskId) => {
            console.log('Falling back to HTTP polling');
            
            const pollInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/text-to-video/status/${taskId}`);
                    const data = await response.json();
                    
                    if (data.status === 'completed' && data.video_url) {
                        clearInterval(pollInterval);
                        showStatus(t('video_ready_t2v', 'Video generation completed!'), 'success');
                        
                        if (t2vGeneratedVideo) {
                            t2vGeneratedVideo.src = data.video_url;
                            t2vGeneratedVideo.load();
                        }
                        
                        if (t2vResultSection) {
                            t2vResultSection.style.display = 'block';
                        }
                        
                        if (t2vSampleVideoPlaceholder) {
                            t2vSampleVideoPlaceholder.style.display = 'none';
                        }
                        
                        if (t2vDownloadVideoLink) {
                            t2vDownloadVideoLink.href = data.video_url;
                            t2vDownloadVideoLink.style.display = 'block';
                        }
                        
                        if (generateTextToVideoButton) {
                            generateTextToVideoButton.disabled = false;
                        }
                        
                    } else if (data.status === 'failed') {
                        clearInterval(pollInterval);
                        showStatus(t('video_generation_failed_t2v', 'Video generation failed: ') + (data.error || 'Unknown error'), 'danger');
                        if (generateTextToVideoButton) {
                            generateTextToVideoButton.disabled = false;
                        }
                        
                    } else if (data.progress !== undefined) {
                        showStatus(t('processing_progress_t2v', 'Processing... ') + data.progress + '%', 'info', true);
                    }
                    
                } catch (error) {
                    console.error('Error polling for status:', error);
                }
            }, 5000); // Poll every 5 seconds
        };
    }

    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('task_id');
        const paymentStatus = urlParams.get('payment_status');
        
        if (!taskId) return;
        
        // Handle payment status
        if (paymentStatus === 'success') {
            showStatus(t('payment_successful_t2v', 'Payment successful! Starting video generation...'), 'success');
            
            // Mark task as paid and start processing
            setTimeout(async () => {
                try {
                    // First mark as paid
                    const markPaidResponse = await fetch(`/api/text-to-video/mark-paid/${taskId}`, {
                        method: 'POST'
                    });
                    
                    if (!markPaidResponse.ok) {
                        const error = await markPaidResponse.json();
                        throw new Error(error.message || 'Failed to record payment');
                    }
                    
                    // Then start processing
                    const processResponse = await fetch(`/api/text-to-video/process/${taskId}`, {
                        method: 'POST'
                    });
                    
                    if (!processResponse.ok) {
                        const error = await processResponse.json();
                        throw new Error(error.message || 'Failed to start processing');
                    }
                    
                    // Start polling for results
                    pollForT2VResult(taskId);
                } catch (error) {
                    console.error('Error processing task after payment:', error);
                    showStatus(`${t('error_processing_task_t2v', 'Error processing task:')} ${error.message}`, 'danger');
                    if (generateTextToVideoButton) {
                        generateTextToVideoButton.disabled = false;
                    }
                }
            }, 1000);
            
        } else if (paymentStatus === 'canceled') {
            showStatus(t('payment_canceled_t2v', 'Payment was canceled.'), 'warning');
            if (generateTextToVideoButton) {
                generateTextToVideoButton.disabled = false;
            }
        }
    }

    const samples = [
        {
            category: "Nature & Landscapes",
            prompts: [
                "A serene mountain lake at sunset with golden light reflecting on the water and pine trees swaying gently in the breeze",
                "Crystal clear waterfall cascading down moss-covered rocks in a lush green forest with mist rising from the falls",
                "Vibrant autumn forest with colorful leaves falling slowly, sunlight filtering through the canopy creating golden beams",
                "Majestic eagle soaring high above snow-capped mountains with dramatic clouds and a vast valley below",
                "Peaceful meadow with wildflowers blooming in spring, butterflies dancing in the air and gentle wind waves"
            ]
        },
        {
            category: "Animals & Wildlife",
            prompts: [
                "Graceful deer family walking through a misty forest at dawn, morning light filtering through the trees",
                "Playful dolphins leaping out of crystal blue ocean waves, sunlight sparkling on the water surface",
                "Majestic lion walking slowly across the savanna at golden hour, with long shadows and dust particles in the air",
                "Colorful tropical fish swimming through a vibrant coral reef with bubbles rising and sunlight streaming through",
                "Butterfly emerging from its chrysalis, wings slowly unfolding and drying in the warm sunlight"
            ]
        },
        {
            category: "Urban & City",
            prompts: [
                "Busy city street at night with neon lights reflecting on wet pavement, cars passing by with headlights",
                "Modern skyscrapers in a bustling downtown area, people walking on sidewalks and traffic flowing smoothly",
                "Historic European town square with cobblestone streets, fountain in the center and people gathering",
                "Futuristic cityscape with flying cars and holographic advertisements, rain falling on the glass buildings",
                "Quiet suburban neighborhood at dusk, streetlights turning on and warm lights in house windows"
            ]
        },
        {
            category: "Everyday Life",
            prompts: [
                "Freshly baked bread cooling on a wooden table in a cozy kitchen, steam rising and golden crust glistening",
                "Children playing in a park with autumn leaves falling, laughing and running through colorful piles",
                "Coffee shop interior with people working on laptops, steam rising from mugs and warm ambient lighting",
                "Rain falling on a window with city lights blurred outside, creating a cozy indoor atmosphere",
                "Person reading a book by a fireplace, pages turning slowly and warm firelight dancing on the walls"
            ]
        }
    ];

    function loadSampleGallery() {
        if (!t2vSampleGallery) return;
        t2vSampleGallery.innerHTML = '';
        
        // Create a container for prompt examples
        const examplesContainer = document.createElement('div');
        examplesContainer.className = 'prompt-examples';
                
        // Add examples by category
        samples.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'prompt-category';
            
            const categoryTitle = document.createElement('h5');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = category.category;
            categoryDiv.appendChild(categoryTitle);
            
            category.prompts.forEach(prompt => {
                const exampleDiv = document.createElement('div');
                exampleDiv.className = 'prompt-example';
                exampleDiv.innerHTML = `
                    <div class="prompt-text">"${prompt}"</div>
                    <button class="btn btn-sm btn-outline-primary use-example-btn" data-prompt="${prompt.replace(/"/g, '&quot;')}">
                        <i class="bi bi-plus-circle"></i> Use This
                    </button>
                `;
                categoryDiv.appendChild(exampleDiv);
            });
            
            examplesContainer.appendChild(categoryDiv);
        });
        
        t2vSampleGallery.appendChild(examplesContainer);

        // Add event listeners to example buttons
        document.querySelectorAll('.use-example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.closest('.use-example-btn').getAttribute('data-prompt');
                if (t2vPrompt) {
                    t2vPrompt.value = prompt;
                    t2vPrompt.dispatchEvent(new Event('input'));
                    // Scroll to prompt field
                    t2vPrompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    t2vPrompt.focus();
                    
                    // Add a subtle animation to show it was clicked
                    e.target.closest('.use-example-btn').style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        e.target.closest('.use-example-btn').style.transform = '';
                    }, 150);
                }
            });
        });
    }
    loadSampleGallery();
});

if (typeof translationsObj === 'undefined') {
    var translationsObj = {};
}
