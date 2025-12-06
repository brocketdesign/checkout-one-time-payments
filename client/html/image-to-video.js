document.addEventListener('DOMContentLoaded', () => {
    // Base elements
    const i2vImageDropZone = document.getElementById('i2vImageDropZone');
    const i2vImageInput = document.getElementById('i2vImageInput');
    const i2vImageUploadBtn = document.getElementById('i2vImageUploadBtn');
    const i2vImagePreviewContainer = document.getElementById('i2vImagePreviewContainer');
    const i2vImagePreview = document.getElementById('i2vImagePreview');
    const i2vImageDetails = document.getElementById('i2vImageDetails');
    const i2vPrompt = document.getElementById('i2vPrompt');
    const i2vPromptCharCount = document.getElementById('i2vPromptCharCount');
    const i2vMotionIntensity = document.getElementById('i2vMotionIntensity');
    const i2vMotionIntensityValue = document.getElementById('i2vMotionIntensityValue');
    const i2vModelSelect = document.getElementById('i2vModelSelect');
    const generateImageToVideoButton = document.getElementById('generateImageToVideoButton');
    const i2vStatus = document.getElementById('i2vStatus');
    const i2vResultSection = document.getElementById('i2vResultSection');
    const i2vGeneratedVideo = document.getElementById('i2vGeneratedVideo');
    const i2vSampleVideoPlaceholder = document.getElementById('i2vSampleVideoPlaceholder');
    const downloadVideoLink = document.getElementById('downloadVideoLink');
    const i2vSampleGallery = document.getElementById('i2vSampleGallery');
    const i2vNegativePrompt = document.getElementById('i2vNegativePrompt');
    const i2vNegativePromptCharCount = document.getElementById('i2vNegativePromptCharCount');
    const i2vSkipPayment = document.getElementById('i2vSkipPayment');
    const i2vPaymentStatus = document.getElementById('i2vPaymentStatus');
    const i2vSkipPaymentContainer = document.getElementById('i2vSkipPaymentContainer');
    const i2vKlingOptions = document.getElementById('i2vKlingOptions');
    const i2vGuidanceScale = document.getElementById('i2vGuidanceScale');
    const i2vGuidanceScaleValue = document.getElementById('i2vGuidanceScaleValue');
    const i2vMode = document.getElementById('i2vMode');
    const i2vEndImageContainer = document.getElementById('i2vEndImageContainer');
    const i2vEndImageDropZone = document.getElementById('i2vEndImageDropZone');
    const i2vEndImageInput = document.getElementById('i2vEndImageInput');
    const i2vEndImageUploadBtn = document.getElementById('i2vEndImageUploadBtn');
    const i2vEndImagePreviewContainer = document.getElementById('i2vEndImagePreviewContainer');
    const i2vEndImagePreview = document.getElementById('i2vEndImagePreview');
    const i2vWanOptions = document.getElementById('i2vWanOptions');
    const i2vResolution = document.getElementById('i2vResolution');
    const i2vSeed = document.getElementById('i2vSeed');
    const i2vSteps = document.getElementById('i2vSteps');
    const i2vStepsValue = document.getElementById('i2vStepsValue');
    const i2vWanGuidanceScale = document.getElementById('i2vWanGuidanceScale');
    const i2vWanGuidanceScaleValue = document.getElementById('i2vWanGuidanceScaleValue');
    const i2vFlowShift = document.getElementById('i2vFlowShift');
    const i2vFlowShiftValue = document.getElementById('i2vFlowShiftValue');
    const i2vFastMode = document.getElementById('i2vFastMode');
    const i2vSafetyChecker = document.getElementById('i2vSafetyChecker');
    const i2vAddEndFrame = document.getElementById('i2vAddEndFrame');
    const endFrameSection = document.getElementById('endFrameSection');

    const t = (key, fallback) => translationsObj && translationsObj[key] ? translationsObj[key] : fallback;

    // Initialize enhanced form elements if external libraries are loaded
    initializeEnhancedFormElements();

    // Initialize drag zones with modern styling
    initializeDragAndDrop();

    // Check URL parameters for payment status and task ID
    checkUrlParameters();

    // Handle payment skip checkbox
    const urlParams = new URLSearchParams(window.location.search);
    const forceSkipPayment = urlParams.get('skip_payment') === 'true';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.');
    
    if ((isLocal || forceSkipPayment) && i2vSkipPaymentContainer && i2vSkipPayment && i2vPaymentStatus) {
        i2vSkipPaymentContainer.style.display = 'block';
        
        // Default to checked on localhost or if URL parameter is set
        i2vSkipPayment.checked = isLocal || forceSkipPayment;

        const updatePaymentStatus = () => {
            if (i2vSkipPayment.checked) {
                i2vPaymentStatus.classList.remove('warning');
                i2vPaymentStatus.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>' + t('payment_skipped_local', 'Payment skipped (local)') + '</span>';
            } else {
                i2vPaymentStatus.classList.add('warning');
                i2vPaymentStatus.innerHTML = '<i class="bi bi-info-circle-fill"></i><span>' + t('payment_required', 'Payment required') + '</span>';
            }
        };

        i2vSkipPayment.addEventListener('change', updatePaymentStatus);
        updatePaymentStatus();
    } else {
        if (i2vSkipPaymentContainer) {
            i2vSkipPaymentContainer.style.display = 'none';
        }
        if (i2vPaymentStatus) {
            i2vPaymentStatus.classList.add('warning');
            i2vPaymentStatus.innerHTML = '<i class="bi bi-info-circle-fill"></i><span>' + t('payment_required', 'Payment required') + '</span>';
        }
    }

    const MAX_IMAGE_SIZE_I2V = 10 * 1024 * 1024; // 10MB

    // Handle end frame toggle
    if (i2vAddEndFrame && endFrameSection) {
        i2vAddEndFrame.addEventListener('change', () => {
            endFrameSection.classList.toggle('d-none', !i2vAddEndFrame.checked);
            if (!i2vAddEndFrame.checked) {
                resetEndImagePreview();
            }
        });
    }

    if (i2vImageUploadBtn) {
        i2vImageUploadBtn.addEventListener('click', () => i2vImageInput.click());
    }

    if (i2vPrompt) {
        i2vPrompt.addEventListener('input', () => {
            const count = i2vPrompt.value.length;
            if (i2vPromptCharCount) i2vPromptCharCount.textContent = count;
        });
    }

    if (i2vMotionIntensity && i2vMotionIntensityValue) {
        i2vMotionIntensity.addEventListener('input', (event) => {
            i2vMotionIntensityValue.textContent = event.target.value;
        });
    }

    if (i2vNegativePrompt && i2vNegativePromptCharCount) {
        i2vNegativePrompt.addEventListener('input', () => {
            const count = i2vNegativePrompt.value.length;
            i2vNegativePromptCharCount.textContent = count;
        });
    }

    if (i2vGuidanceScale && i2vGuidanceScaleValue) {
        i2vGuidanceScale.addEventListener('input', (event) => {
            i2vGuidanceScaleValue.textContent = event.target.value;
        });
    }

    if (i2vMode && i2vEndImageContainer) {
        i2vMode.addEventListener('change', () => {
            const isProfessional = i2vMode.value === 'Professional';
            i2vEndImageContainer.classList.toggle('d-none', !isProfessional);
            if (!isProfessional) {
                if (i2vAddEndFrame && i2vAddEndFrame.checked) {
                    i2vAddEndFrame.checked = false;
                    if (endFrameSection) {
                        endFrameSection.classList.add('d-none');
                    }
                }
                resetEndImagePreview();
            }
        });
    }

    if (i2vSteps && i2vStepsValue) {
        i2vSteps.addEventListener('input', (event) => {
            i2vStepsValue.textContent = event.target.value;
        });
    }

    if (i2vWanGuidanceScale && i2vWanGuidanceScaleValue) {
        i2vWanGuidanceScale.addEventListener('input', (event) => {
            i2vWanGuidanceScaleValue.textContent = event.target.value;
        });
    }

    if (i2vFlowShift && i2vFlowShiftValue) {
        i2vFlowShift.addEventListener('input', (event) => {
            i2vFlowShiftValue.textContent = event.target.value;
        });
    }

    if (i2vModelSelect) {
        i2vModelSelect.addEventListener('change', () => {
            if (i2vModelSelect.value === 'kling-v1.6-i2v') {
                if (i2vKlingOptions) i2vKlingOptions.classList.remove('d-none');
                if (i2vWanOptions) i2vWanOptions.classList.add('d-none');
            } else if (i2vModelSelect.value === 'wan-i2v') {
                if (i2vKlingOptions) i2vKlingOptions.classList.add('d-none');
                if (i2vWanOptions) i2vWanOptions.classList.remove('d-none');
            }
        });
    }

    function handleImageFile(file) {
        if (!file) return;

        const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!acceptedImageTypes.includes(file.type)) {
            showStatus(t('unsupported_file_type_i2v', 'Unsupported file type. Please upload JPG, PNG, or WEBP.'), 'danger');
            resetImagePreview();
            return;
        }

        if (file.size > MAX_IMAGE_SIZE_I2V) {
            showStatus(t('file_too_large_i2v', `File is too large. Max size: ${MAX_IMAGE_SIZE_I2V / (1024 * 1024)}MB.`), 'danger');
            resetImagePreview();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (i2vImagePreview) {
                i2vImagePreview.src = e.target.result;
                i2vImagePreview.style.objectFit = 'contain'; // Ensure the image fits within the container
                i2vImagePreviewContainer.style.display = 'flex';
                i2vImageDetails.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);

        displayImageDetails(file);
        clearStatus();
    }

    function resetImagePreview() {
        if (i2vImageInput) i2vImageInput.value = '';
        if (i2vImagePreview) i2vImagePreview.src = '';
        if (i2vImagePreviewContainer) i2vImagePreviewContainer.style.display = 'none';
        if (i2vImageDetails) i2vImageDetails.style.display = 'block';
    }

    function displayImageDetails(file) {
        if (!file || !i2vImageDetails) return;
        const image = new Image();
        image.onload = () => {
            i2vImageDetails.innerHTML = `
                <ul class="list-unstyled">
                    <li><strong>${t('file_name', 'Name')}:</strong> ${file.name}</li>
                    <li><strong>${t('resolution', 'Resolution')}:</strong> ${image.width}x${image.height}</li>
                    <li><strong>${t('size', 'Size')}:</strong> ${(file.size / (1024 * 1024)).toFixed(2)} MB</li>
                </ul>`;
            URL.revokeObjectURL(image.src);
        };
        image.onerror = () => {
            i2vImageDetails.innerHTML = `<p class="text-danger">${t('error_loading_metadata', 'Error loading image metadata.')}</p>`;
            URL.revokeObjectURL(image.src);
        };
        image.style.display = 'none';
        image.src = URL.createObjectURL(file);
    }

    function handleEndImageFile(file) {
        if (!file) return;

        const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!acceptedImageTypes.includes(file.type)) {
            showStatus(t('unsupported_file_type_i2v', 'Unsupported file type. Please upload JPG, PNG, or WEBP.'), 'warning');
            resetEndImagePreview();
            return;
        }

        if (file.size > MAX_IMAGE_SIZE_I2V) {
            showStatus(t('file_too_large_i2v', `End image file is too large. Max size: ${MAX_IMAGE_SIZE_I2V / (1024 * 1024)}MB.`), 'warning');
            resetEndImagePreview();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (i2vEndImagePreview) {
                i2vEndImagePreview.src = e.target.result;
                i2vEndImagePreview.style.objectFit = 'contain'; // Ensure the image fits within the container
                if (i2vEndImagePreviewContainer) {
                    i2vEndImagePreviewContainer.style.display = 'flex';
                }
            }
        };
        reader.readAsDataURL(file);

        clearStatus();
    }

    function resetEndImagePreview() {
        if (i2vEndImageInput) i2vEndImageInput.value = '';
        if (i2vEndImagePreview) i2vEndImagePreview.src = '';
        if (i2vEndImagePreviewContainer) i2vEndImagePreviewContainer.style.display = 'none';
    }

    function showStatus(message, type = 'info', isLoading = false) {
        if (!i2vStatus) return;
        let iconHtml = '';
        if (isLoading) {
            iconHtml = '<div class="spinner-border spinner-border-sm me-2" role="status"></div>';
        }
        i2vStatus.innerHTML = `<div class="alert alert-${type} d-flex align-items-center">${iconHtml}<span>${message}</span></div>`;
    }

    function clearStatus() {
        if (i2vStatus) i2vStatus.innerHTML = '';
    }

    function initializeDragAndDrop() {
        if (i2vImageDropZone) {
            i2vImageDropZone.addEventListener('dragover', (event) => {
                event.preventDefault();
                i2vImageDropZone.classList.add('hover');
            });
            i2vImageDropZone.addEventListener('dragleave', () => {
                i2vImageDropZone.classList.remove('hover');
            });
            i2vImageDropZone.addEventListener('drop', (event) => {
                event.preventDefault();
                i2vImageDropZone.classList.remove('hover');
                const files = event.dataTransfer.files;
                if (files.length > 0) {
                    handleImageFile(files[0]);
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(files[0]);
                    i2vImageInput.files = dataTransfer.files;
                }
            });

            i2vImageInput.addEventListener('change', (event) => {
                if (event.target.files && event.target.files.length > 0) {
                    handleImageFile(event.target.files[0]);
                }
            });
        }

        if (i2vEndImageDropZone) {
            i2vEndImageDropZone.addEventListener('dragover', (event) => {
                event.preventDefault();
                i2vEndImageDropZone.classList.add('hover');
            });
            i2vEndImageDropZone.addEventListener('dragleave', () => {
                i2vEndImageDropZone.classList.remove('hover');
            });
            i2vEndImageDropZone.addEventListener('drop', (event) => {
                event.preventDefault();
                i2vEndImageDropZone.classList.remove('hover');
                const files = event.dataTransfer.files;
                if (files.length > 0) {
                    handleEndImageFile(files[0]);
                }
            });

            if (i2vEndImageUploadBtn) {
                i2vEndImageUploadBtn.addEventListener('click', () => i2vEndImageInput.click());
            }

            if (i2vEndImageInput) {
                i2vEndImageInput.addEventListener('change', (event) => {
                    if (event.target.files && event.target.files.length > 0) {
                        handleEndImageFile(event.target.files[0]);
                    }
                });
            }
        }
    }

    function initializeEnhancedFormElements() {
        if (typeof Choices !== 'undefined') {
            if (i2vModelSelect) {
                new Choices(i2vModelSelect, {
                    searchEnabled: false,
                    itemSelectText: '',
                    shouldSort: false,
                    classNames: {
                        containerOuter: 'choices form-select'
                    }
                });
            }

            if (i2vMode) {
                new Choices(i2vMode, {
                    searchEnabled: false,
                    itemSelectText: '',
                    shouldSort: false,
                    classNames: {
                        containerOuter: 'choices form-select'
                    }
                });
            }

            if (i2vResolution) {
                new Choices(i2vResolution, {
                    searchEnabled: false,
                    itemSelectText: '',
                    shouldSort: false,
                    classNames: {
                        containerOuter: 'choices form-select'
                    }
                });
            }
        }

        if (typeof noUiSlider !== 'undefined') {
            const motionIntensitySlider = document.getElementById('i2vMotionIntensitySlider');
            if (motionIntensitySlider && i2vMotionIntensityValue) {
                noUiSlider.create(motionIntensitySlider, {
                    start: [127],
                    connect: 'lower',
                    range: {
                        'min': 1,
                        'max': 255
                    },
                    format: {
                        to: value => Math.round(value),
                        from: value => value
                    }
                });

                motionIntensitySlider.noUiSlider.on('update', (values) => {
                    i2vMotionIntensityValue.textContent = values[0];
                    if (i2vMotionIntensity) i2vMotionIntensity.value = values[0];
                });

                if (i2vMotionIntensity) {
                    i2vMotionIntensity.addEventListener('change', () => {
                        motionIntensitySlider.noUiSlider.set(i2vMotionIntensity.value);
                    });
                }
            }

            const guidanceScaleSlider = document.getElementById('i2vGuidanceScaleSlider');
            if (guidanceScaleSlider && i2vGuidanceScaleValue) {
                noUiSlider.create(guidanceScaleSlider, {
                    start: [0.5],
                    connect: 'lower',
                    range: {
                        'min': 0,
                        'max': 1
                    },
                    step: 0.05,
                    format: {
                        to: value => parseFloat(value).toFixed(2),
                        from: value => parseFloat(value)
                    }
                });

                guidanceScaleSlider.noUiSlider.on('update', (values) => {
                    i2vGuidanceScaleValue.textContent = values[0];
                    if (i2vGuidanceScale) i2vGuidanceScale.value = values[0];
                });

                if (i2vGuidanceScale) {
                    i2vGuidanceScale.addEventListener('change', () => {
                        guidanceScaleSlider.noUiSlider.set(i2vGuidanceScale.value);
                    });
                }
            }

            const stepsSlider = document.getElementById('i2vStepsSlider');
            if (stepsSlider && i2vStepsValue) {
                noUiSlider.create(stepsSlider, {
                    start: [30],
                    connect: 'lower',
                    range: {
                        'min': 1,
                        'max': 40
                    },
                    format: {
                        to: value => Math.round(value),
                        from: value => value
                    }
                });

                stepsSlider.noUiSlider.on('update', (values) => {
                    i2vStepsValue.textContent = values[0];
                    if (i2vSteps) i2vSteps.value = values[0];
                });

                if (i2vSteps) {
                    i2vSteps.addEventListener('change', () => {
                        stepsSlider.noUiSlider.set(i2vSteps.value);
                    });
                }
            }

            const wanGuidanceScaleSlider = document.getElementById('i2vWanGuidanceScaleSlider');
            if (wanGuidanceScaleSlider && i2vWanGuidanceScaleValue) {
                noUiSlider.create(wanGuidanceScaleSlider, {
                    start: [5.0],
                    connect: 'lower',
                    range: {
                        'min': 0,
                        'max': 10
                    },
                    step: 0.1,
                    format: {
                        to: value => parseFloat(value).toFixed(1),
                        from: value => parseFloat(value)
                    }
                });

                wanGuidanceScaleSlider.noUiSlider.on('update', (values) => {
                    i2vWanGuidanceScaleValue.textContent = values[0];
                    if (i2vWanGuidanceScale) i2vWanGuidanceScale.value = values[0];
                });

                if (i2vWanGuidanceScale) {
                    i2vWanGuidanceScale.addEventListener('change', () => {
                        wanGuidanceScaleSlider.noUiSlider.set(i2vWanGuidanceScale.value);
                    });
                }
            }

            const flowShiftSlider = document.getElementById('i2vFlowShiftSlider');
            if (flowShiftSlider && i2vFlowShiftValue) {
                noUiSlider.create(flowShiftSlider, {
                    start: [5.0],
                    connect: 'lower',
                    range: {
                        'min': 1,
                        'max': 10
                    },
                    step: 0.1,
                    format: {
                        to: value => parseFloat(value).toFixed(1),
                        from: value => parseFloat(value)
                    }
                });

                flowShiftSlider.noUiSlider.on('update', (values) => {
                    i2vFlowShiftValue.textContent = values[0];
                    if (i2vFlowShift) i2vFlowShift.value = values[0];
                });

                if (i2vFlowShift) {
                    i2vFlowShift.addEventListener('change', () => {
                        flowShiftSlider.noUiSlider.set(i2vFlowShift.value);
                    });
                }
            }
        }
    }

    if (generateImageToVideoButton) {
        generateImageToVideoButton.addEventListener('click', async () => {
            const imageFile = i2vImageInput.files && i2vImageInput.files[0];
            if (!imageFile) {
                showStatus(t('select_image_first_i2v', 'Please select an image first.'), 'warning');
                return;
            }

            const promptText = i2vPrompt ? i2vPrompt.value.trim() : '';
            const videoLength = '5';
            const motionIntensity = i2vMotionIntensity ? i2vMotionIntensity.value : '127';
            const model = i2vModelSelect ? i2vModelSelect.value : 'kling-v1.6-i2v';
            const negativePrompt = i2vNegativePrompt ? i2vNegativePrompt.value.trim() : '';
            let skipPayment = false;
            const urlParams = new URLSearchParams(window.location.search);
            const forceSkipPayment = urlParams.get('skip_payment') === 'true';
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.');
            
            if (isLocal || forceSkipPayment) {
                skipPayment = i2vSkipPayment ? i2vSkipPayment.checked : false;
            }

            showStatus(t('generating_video_i2v', 'Generating video, please wait... This may take a few minutes.'), 'info', true);
            if (i2vResultSection) i2vResultSection.style.display = 'none';
            if (i2vGeneratedVideo) i2vGeneratedVideo.src = '';
            if (i2vSampleVideoPlaceholder) i2vSampleVideoPlaceholder.style.display = 'block';
            if (downloadVideoLink) downloadVideoLink.style.display = 'none';
            generateImageToVideoButton.disabled = true;

            const formData = new FormData();
            formData.append('image_file', imageFile);
            formData.append('prompt', promptText);
            formData.append('video_length_seconds', videoLength);
            formData.append('motion_bucket_id', motionIntensity);
            formData.append('model_name', model);
            formData.append('negative_prompt', negativePrompt);
            formData.append('skipPayment', skipPayment);

            if (model === 'kling-v1.6-i2v') {
                formData.append('guidance_scale', i2vGuidanceScale ? i2vGuidanceScale.value : '0.5');
                formData.append('mode', i2vMode ? i2vMode.value : 'Standard');

                if (i2vMode && i2vMode.value === 'Professional' && i2vAddEndFrame && i2vAddEndFrame.checked &&
                    i2vEndImageInput && i2vEndImageInput.files && i2vEndImageInput.files[0]) {
                    formData.append('end_image_file', i2vEndImageInput.files[0]);
                }
            } else if (model === 'wan-i2v') {
                const resolution = i2vResolution ? i2vResolution.value : '720p';
                formData.append('width', resolution === '720p' ? '1280' : '832');
                formData.append('height', resolution === '720p' ? '720' : '480');
                formData.append('seed', i2vSeed ? i2vSeed.value : '-1');
                formData.append('steps', i2vSteps ? i2vSteps.value : '30');
                formData.append('guidance_scale', i2vWanGuidanceScale ? i2vWanGuidanceScale.value : '5.0');
                formData.append('flow_shift', i2vFlowShift ? i2vFlowShift.value : '5.0');
                formData.append('fast_mode', i2vFastMode ? i2vFastMode.checked : false);
                formData.append('enable_safety_checker', i2vSafetyChecker ? i2vSafetyChecker.checked : true);
            }

            try {
                const response = await fetch('/api/image-to-video', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || result.error || `HTTP error ${response.status}`);
                }

                if (result.task_id) {
                    if (result.require_payment) {
                        try {
                            const paymentResponse = await fetch('/api/i2v-create-checkout-session', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    task_id: result.task_id,
                                    currency: document.cookie.includes('preferredLanguage=ja') ? 'jpy' : 'usd'
                                }),
                            });

                            const paymentResult = await paymentResponse.json();

                            if (!paymentResponse.ok) {
                                showStatus(`${t('error_creating_payment_i2v', 'Error creating payment session:')} ${paymentResult.error || 'Unknown error'}`, 'danger');
                                generateImageToVideoButton.disabled = false;
                                return;
                            }

                            const stripe = Stripe(
                                window.location.hostname !== 'localhost' && !window.location.hostname.includes('192.168.')
                                ? 'pk_live_nsU0sDUA4jQEn0c0qOz0XYHl00QYsONl8G'
                                : 'pk_test_51Grb83C8xKGwQm6J0yFqNpWwgFu8MF582uq74ktVViobsBzM2hjVT2fXFvW5JQwLQnoaAmXBWtGevNodYi0bT5uv00sjuMNw1n'
                            );

                            const { error } = await stripe.redirectToCheckout({
                                sessionId: paymentResult.sessionId
                            });

                            if (error) {
                                showStatus(`${t('error_redirect_payment_i2v', 'Error redirecting to payment:')} ${error.message}`, 'danger');
                                generateImageToVideoButton.disabled = false;
                            }
                        } catch (payError) {
                            console.error('Payment error:', payError);
                            showStatus(`${t('payment_error_i2v', 'Payment error:')} ${payError.message}`, 'danger');
                            generateImageToVideoButton.disabled = false;
                        }
                    } else {
                        try {
                            const processResponse = await fetch(`/api/image-to-video/process/${result.task_id}`, {
                                method: 'POST',
                            });

                            if (!processResponse.ok) {
                                const processError = await processResponse.json();
                                throw new Error(processError.message || 'Failed to start processing');
                            }

                            showStatus(t('processing_started_i2v', 'Processing started! Polling for results...'), 'info', true);
                            pollForI2VResult(result.task_id);
                        } catch (processError) {
                            console.error('Processing error:', processError);
                            showStatus(`${t('processing_error_i2v', 'Processing error:')} ${processError.message}`, 'danger');
                            generateImageToVideoButton.disabled = false;
                        }
                    }
                } else {
                    throw new Error(t('unexpected_response_i2v', 'Unexpected response from server. Task ID missing.'));
                }
            } catch (error) {
                console.error('Error generating video:', error);
                showStatus(`${t('error_generating_video_i2v', 'Error generating video:')} ${error.message}`, 'danger');
                generateImageToVideoButton.disabled = false;
            }
        });
    }

    async function pollForI2VResult(taskId) {
        // Disable the generate button during processing
        if (generateImageToVideoButton) {
            generateImageToVideoButton.disabled = true;
        }
        
        // Hide any result that might be showing
        if (i2vResultSection) {
            i2vResultSection.style.display = 'none';
        }
        
        // Show the placeholder
        if (i2vSampleVideoPlaceholder) {
            i2vSampleVideoPlaceholder.style.display = 'block';
        }
        
        // Reset video source
        if (i2vGeneratedVideo) {
            i2vGeneratedVideo.src = '';
        }
        
        // Hide download link
        if (downloadVideoLink) {
            downloadVideoLink.style.display = 'none';
        }

        const tempId = 'temp_' + Math.random().toString(36).substring(2, 15);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/image-to-video-ws?task_id=${taskId}&tempId=${tempId}`;
        console.log('Connecting to WebSocket:', wsUrl);

        let ws = new WebSocket(wsUrl);
        let fallbackPolling = false;
        let wsConnected = false;

        ws.onopen = () => {
            console.log('WebSocket connection established for task:', taskId);
            wsConnected = true;
            ws.send(JSON.stringify({
                task_id: taskId,
                type: 'check_status',
                tempId: tempId
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket message received:', data);

                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                    return;
                }

                if (data.progress !== undefined) {
                    const progressMessage = `${t('task_status_update_i2v', 'Task status:')} ${data.status || 'PROCESSING'}. (${data.progress}%)`;
                    showStatus(progressMessage, 'info', true);
                }

                if (data.status === 'success') {
                    if (data.video_url) {
                        if (i2vGeneratedVideo) {
                            i2vGeneratedVideo.src = data.video_url;
                            i2vGeneratedVideo.oncanplaythrough = () => {
                                if (i2vResultSection) i2vResultSection.style.display = 'block';
                                if (i2vSampleVideoPlaceholder) i2vSampleVideoPlaceholder.style.display = 'none';
                                if (downloadVideoLink) {
                                    downloadVideoLink.href = data.video_url;
                                    downloadVideoLink.style.display = 'inline-block';
                                }
                            };
                            i2vGeneratedVideo.onerror = () => {
                                showStatus(t('error_loading_generated_video_i2v', 'Error loading generated video.'), 'danger');
                            };
                        }
                        showStatus(t('video_generated_successfully_i2v', 'Video generated successfully!'), 'success');
                    } else {
                        showStatus(t('video_url_missing_i2v', 'Video URL missing in successful response.'), 'warning');
                    }
                    if (generateImageToVideoButton) generateImageToVideoButton.disabled = false;
                    ws.close();
                } else if (data.status === 'failed') {
                    showStatus(`${t('video_generation_failed_i2v', 'Video generation failed.')} ${data.error || ''}`, 'danger');
                    if (generateImageToVideoButton) generateImageToVideoButton.disabled = false;
                    ws.close();
                } else if (data.status === 'timeout') {
                    showStatus(t('task_timeout_i2v', 'Video generation timed out. Please try again.'), 'warning');
                    if (generateImageToVideoButton) generateImageToVideoButton.disabled = false;
                    ws.close();
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (!fallbackPolling) {
                fallbackPolling = true;
                console.log('Falling back to HTTP polling');
                fallbackToPolling();
            }
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
            if (!fallbackPolling) {
                fallbackPolling = true;
                console.log('WebSocket closed, falling back to HTTP polling');
                fallbackToPolling();
            }
        };

        const fallbackToPolling = () => {
            const pollInterval = 7000;
            const maxAttempts = 90;
            let attempts = 0;

            const checkStatus = async () => {
                attempts++;
                if (attempts > maxAttempts) {
                    showStatus(t('task_timeout_i2v', 'Video generation timed out. Please try again or check your creations.'), 'warning');
                    if (generateImageToVideoButton) generateImageToVideoButton.disabled = false;
                    return;
                }

                try {
                    const response = await fetch(`/api/image-to-video/status/${taskId}`);
                    const result = await response.json();

                    if (!response.ok) {
                        console.error(`Status check failed for ${taskId}: ${result.message || result.error || response.statusText}`);
                        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                            showStatus(`${t('error_checking_status_i2v', 'Error checking status:')} ${result.message || result.error || response.statusText}`, 'danger');
                            if (generateImageToVideoButton) generateImageToVideoButton.disabled = false;
                            return;
                        }
                        setTimeout(checkStatus, pollInterval * (attempts % 3 === 0 ? 2 : 1));
                        return;
                    }

                    let progressMessage = `${t('task_status_update_i2v', 'Task status:')} ${result.status || 'UNKNOWN'}.`;
                    if (result.progress && result.progress.percentage) {
                        progressMessage += ` (${result.progress.percentage.toFixed(1)}%)`;
                    }
                    if (result.status === 'PROCESSING' || result.status === 'PENDING') {
                        progressMessage += ` ${t('still_processing_i2v', 'Still processing...')} (${attempts}/${maxAttempts})`;
                    }
                    showStatus(progressMessage, 'info', (result.status === 'PROCESSING' || result.status === 'PENDING'));

                    if (result.status === 'SUCCESS') {
                        if (result.video_url) {
                            if (i2vGeneratedVideo) {
                                i2vGeneratedVideo.src = result.video_url;
                                i2vGeneratedVideo.oncanplaythrough = () => {
                                    if (i2vResultSection) i2vResultSection.style.display = 'block';
                                    if (i2vSampleVideoPlaceholder) i2vSampleVideoPlaceholder.style.display = 'none';
                                    if (downloadVideoLink) {
                                        downloadVideoLink.href = result.video_url;
                                        downloadVideoLink.style.display = 'inline-block';
                                    }
                                };
                                i2vGeneratedVideo.onerror = () => {
                                    showStatus(t('error_loading_generated_video_i2v', 'Error loading generated video.'), 'danger');
                                };
                            }
                            showStatus(t('video_generated_successfully_i2v', 'Video generated successfully!'), 'success');
                        } else {
                            showStatus(t('video_url_missing_i2v', 'Video URL missing in successful response.'), 'warning');
                        }
                        if (generateImageToVideoButton) generateImageToVideoButton.disabled = false;
                    } else if (result.status === 'FAILED' || result.status === 'ERROR') {
                        showStatus(`${t('video_generation_failed_i2v', 'Video generation failed.')} ${result.error_message || result.message || ''}`, 'danger');
                        if (generateImageToVideoButton) generateImageToVideoButton.disabled = false;
                    } else if (result.status === 'PROCESSING' || result.status === 'PENDING') {
                        setTimeout(checkStatus, pollInterval);
                    } else {
                        console.warn('Unknown task status:', result.status, result);
                        setTimeout(checkStatus, pollInterval);
                    }
                } catch (error) {
                    console.error('Error polling for task status:', error);
                    if (!i2vStatus.innerHTML.includes('alert-danger') && !i2vStatus.innerHTML.includes('alert-success')) {
                        showStatus(`${t('error_checking_status_i2v', 'Error checking task status.')} ${error.message}`, 'warning');
                    }
                    setTimeout(checkStatus, pollInterval * (attempts % 3 === 0 ? 2 : 1));
                }
            };

            setTimeout(checkStatus, 1000);
        };
    }

    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('task_id');
        const paymentStatus = urlParams.get('payment_status');
        
        if (!taskId) return;
        
        // Handle payment status
        if (paymentStatus === 'success') {
            showStatus(t('payment_successful', 'Payment successful! Processing your video...'), 'success', true);
            
            // Mark task as paid and start processing
            setTimeout(async () => {
                try {
                    // First mark as paid
                    const markPaidResponse = await fetch(`/api/image-to-video/mark-paid/${taskId}`, {
                        method: 'POST'
                    });
                    
                    if (!markPaidResponse.ok) {
                        const error = await markPaidResponse.json();
                        throw new Error(error.message || 'Failed to record payment');
                    }
                    
                    // Then start processing
                    const processResponse = await fetch(`/api/image-to-video/process/${taskId}`, {
                        method: 'POST'
                    });
                    
                    if (!processResponse.ok) {
                        const error = await processResponse.json();
                        throw new Error(error.message || 'Failed to start processing');
                    }
                    
                    // Start polling for results
                    pollForI2VResult(taskId);
                } catch (error) {
                    console.error('Error processing task after payment:', error);
                    showStatus(`${t('error_processing_task', 'Error processing task:')} ${error.message}`, 'danger');
                }
            }, 1000);
            
        } else if (paymentStatus === 'canceled') {
            showStatus(t('payment_canceled', 'Payment was canceled. You can try again or select a different payment method.'), 'warning');
            if (generateImageToVideoButton) {
                generateImageToVideoButton.disabled = false;
            }
        }
    }

    const samples = [
        {
            img: '/img/image-to-video-samples/image-01.jpg',
            prompt: 'Two people hug each other in the picture.',
            thumb: '/img/image-to-video-samples/image-01.jpg'
        },
        {
            img: '/img/image-to-video-samples/image-02.jpg',
            prompt: 'A car running on the road.',
            thumb: '/img/image-to-video-samples/image-02.jpg'
        },
        {
            img: '/img/image-to-video-samples/image-03.jpg',
            prompt: 'A man holding his grandson walking towards the sea.',
            thumb: '/img/image-to-video-samples/image-03.jpg'
        },
        {
            img: '/img/image-to-video-samples/image-04.jpg',
            prompt: 'A man wearing sunglasses.',
            thumb: '/img/image-to-video-samples/image-04.jpg'
        }
    ];

    function loadSampleGallery() {
        if (!i2vSampleGallery) return;
        i2vSampleGallery.innerHTML = '';
        samples.forEach(sample => {
            const col = document.createElement('div');
            col.className = 'col';
            const card = document.createElement('div');
            card.className = 'card h-100 sample-card';
            card.style.cursor = 'pointer';

            const img = document.createElement('img');
            img.src = sample.thumb;
            img.className = 'card-img-top';
            img.alt = sample.prompt || 'Sample Image';
            img.style.aspectRatio = '1 / 1';
            img.style.objectFit = 'cover';

            const cardBody = document.createElement('div');
            cardBody.className = 'card-body p-2 d-none';
            const p = document.createElement('p');
            p.className = 'card-text small';
            p.textContent = sample.prompt;
            cardBody.appendChild(p);

            card.appendChild(img);
            card.appendChild(cardBody);
            col.appendChild(card);

            card.addEventListener('click', async () => {
                showStatus(t('loading_sample_i2v', 'Loading sample...'), 'info', true);
                try {
                    const response = await fetch(sample.img);
                    if (!response.ok) throw new Error(`Failed to fetch sample image: ${response.statusText}`);
                    const blob = await response.blob();
                    const fileName = sample.img.substring(sample.img.lastIndexOf('/') + 1) || 'sample.jpg';
                    const file = new File([blob], fileName, { type: blob.type });

                    handleImageFile(file);
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    i2vImageInput.files = dataTransfer.files;

                    if (i2vPrompt) i2vPrompt.value = sample.prompt || '';
                    if (i2vPromptCharCount) i2vPromptCharCount.textContent = (sample.prompt || '').length;

                    clearStatus();
                    document.documentElement.scrollTop = 0;
                } catch (error) {
                    console.error("Error loading sample:", error);
                    showStatus(`${t('error_loading_sample_i2v', 'Error loading sample:')} ${error.message}`, 'danger');
                }
            });
            i2vSampleGallery.appendChild(col);
        });
    }
    loadSampleGallery();
});

if (typeof translationsObj === 'undefined') {
    var translationsObj = {};
}
