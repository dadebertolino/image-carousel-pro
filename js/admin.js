(function($) {
    'use strict';

    $(document).ready(function() {
        
        // Inizializza color picker WordPress
        $('.icp-color-picker').wpColorPicker();
        
        // =============================
        // Media uploader — Immagini (multiplo)
        // =============================
        $('#icp-add-image').on('click', function(e) {
            e.preventDefault();
            
            var frame = wp.media({
                title: 'Seleziona Immagini',
                button: { text: 'Aggiungi selezionate' },
                multiple: true,
                library: { type: 'image' }
            });
            
            frame.on('select', function() {
                var attachments = frame.state().get('selection').toJSON();
                
                // Upload sequenziale per evitare race condition
                function uploadNext(index) {
                    if (index >= attachments.length) return;
                    
                    $.ajax({
                        url: icpAjax.url,
                        type: 'POST',
                        data: {
                            action: 'icp_upload_image',
                            nonce: icpAjax.nonce,
                            attachment_id: attachments[index].id
                        },
                        success: function(response) {
                            if (response.success) {
                                $('#icp-images-list').append(
                                    buildItemHTML(response.data.id, response.data.url, 'image', '')
                                );
                            } else {
                                alert('Errore: ' + response.data);
                            }
                            uploadNext(index + 1);
                        },
                        error: function() {
                            uploadNext(index + 1);
                        }
                    });
                }
                
                uploadNext(0);
            });
            
            frame.open();
        });
        
        // =============================
        // Media uploader — Video (multiplo)
        // =============================
        $('#icp-add-video').on('click', function(e) {
            e.preventDefault();
            
            var frame = wp.media({
                title: 'Seleziona Video',
                button: { text: 'Aggiungi selezionati' },
                multiple: true,
                library: { type: 'video' }
            });
            
            frame.on('select', function() {
                var attachments = frame.state().get('selection').toJSON();
                
                function uploadNext(index) {
                    if (index >= attachments.length) return;
                    
                    $.ajax({
                        url: icpAjax.url,
                        type: 'POST',
                        data: {
                            action: 'icp_upload_video',
                            nonce: icpAjax.nonce,
                            attachment_id: attachments[index].id
                        },
                        success: function(response) {
                            if (response.success) {
                                $('#icp-images-list').append(
                                    buildItemHTML(response.data.id, response.data.url, 'video', response.data.filename)
                                );
                            } else {
                                alert('Errore: ' + response.data);
                            }
                            uploadNext(index + 1);
                        },
                        error: function() {
                            uploadNext(index + 1);
                        }
                    });
                }
                
                uploadNext(0);
            });
            
            frame.open();
        });
        
        // =============================
        // Builder HTML per item griglia
        // =============================
        function buildItemHTML(id, url, type, filename) {
            var mediaHTML;
            
            if (type === 'video') {
                mediaHTML = '<div class="icp-video-thumb">' +
                    '<span class="dashicons dashicons-video-alt3"></span>' +
                    '<span class="icp-video-filename">' + (filename || 'video') + '</span>' +
                    '</div>';
            } else {
                mediaHTML = '<img src="' + url + '" alt="">';
            }
            
            var cropBtn = type !== 'video'
                ? '<button type="button" class="icp-crop-image" data-id="' + id + '" data-url="' + url + '">' +
                  '<span class="dashicons dashicons-image-crop"></span></button>'
                : '';
            
            return '<div class="icp-image-item ' + (type === 'video' ? 'icp-video-item' : '') + '" data-id="' + id + '">' +
                mediaHTML +
                '<div class="icp-image-actions">' +
                    '<span class="dashicons dashicons-move icp-drag-handle"></span>' +
                    cropBtn +
                    '<button type="button" class="icp-delete-image" data-id="' + id + '">' +
                        '<span class="dashicons dashicons-trash"></span>' +
                    '</button>' +
                '</div>' +
                '<div class="icp-image-meta">' +
                    '<input type="text" class="icp-caption-input" data-id="' + id + '" placeholder="Didascalia...">' +
                    '<input type="text" class="icp-tags-input" data-id="' + id + '" placeholder="Tag (es: natura, mare, montagna)">' +
                '</div>' +
            '</div>';
        }
        
        // =============================
        // Elimina elemento
        // =============================
        $(document).on('click', '.icp-delete-image', function(e) {
            e.preventDefault();
            
            if (!confirm('Eliminare questo elemento?')) return;
            
            var $item = $(this).closest('.icp-image-item');
            var id = $(this).data('id');
            
            $.ajax({
                url: icpAjax.url,
                type: 'POST',
                data: {
                    action: 'icp_delete_image',
                    nonce: icpAjax.nonce,
                    image_id: id
                },
                success: function(response) {
                    if (response.success) {
                        $item.fadeOut(300, function() { $(this).remove(); });
                    }
                }
            });
        });
        
        // =============================
        // Salva didascalia (debounced)
        // =============================
        var captionTimeout;
        $(document).on('input', '.icp-caption-input', function() {
            var $input = $(this);
            var id = $input.data('id');
            var caption = $input.val();
            
            clearTimeout(captionTimeout);
            captionTimeout = setTimeout(function() {
                $.ajax({
                    url: icpAjax.url,
                    type: 'POST',
                    data: {
                        action: 'icp_save_caption',
                        nonce: icpAjax.nonce,
                        image_id: id,
                        caption: caption
                    }
                });
            }, 500);
        });
        
        // =============================
        // Salva tag (debounced)
        // =============================
        var tagsTimeout;
        $(document).on('input', '.icp-tags-input', function() {
            var $input = $(this);
            var id = $input.data('id');
            var tags = $input.val();
            
            clearTimeout(tagsTimeout);
            tagsTimeout = setTimeout(function() {
                $.ajax({
                    url: icpAjax.url,
                    type: 'POST',
                    data: {
                        action: 'icp_save_tags',
                        nonce: icpAjax.nonce,
                        image_id: id,
                        tags: tags
                    }
                });
            }, 500);
        });
        
        // =============================
        // Drag & drop riordino
        // =============================
        $('#icp-images-list').sortable({
            handle: '.icp-drag-handle',
            placeholder: 'icp-image-item ui-sortable-placeholder',
            tolerance: 'pointer',
            update: function() {
                var order = [];
                $('.icp-image-item').each(function() {
                    order.push($(this).data('id'));
                });
                
                $.ajax({
                    url: icpAjax.url,
                    type: 'POST',
                    data: {
                        action: 'icp_reorder_images',
                        nonce: icpAjax.nonce,
                        order: order
                    }
                });
            }
        });
        
        // =============================
        // Crop integrato (Jcrop)
        // =============================
        var $cropModal = $('#icp-crop-modal');
        var $cropImage = $('#icp-crop-image');
        var cropJcropApi = null;
        var cropCurrentId = null;
        var cropCoords = null;
        
        // Apri modal crop
        $(document).on('click', '.icp-crop-image', function(e) {
            e.preventDefault();
            
            cropCurrentId = $(this).data('id');
            var url = $(this).data('url');
            
            // Rimuovi eventuale Jcrop precedente
            if (cropJcropApi) {
                cropJcropApi.destroy();
                cropJcropApi = null;
            }
            
            // Carica immagine nel modal
            $cropImage.attr('src', url + '?t=' + Date.now());
            cropCoords = null;
            $cropModal.show();
            
            // Inizializza Jcrop quando l'immagine è caricata
            $cropImage.off('load').on('load', function() {
                $cropImage.Jcrop({
                    onSelect: function(c) {
                        cropCoords = c;
                    },
                    onChange: function(c) {
                        cropCoords = c;
                    }
                }, function() {
                    cropJcropApi = this;
                });
            });
            
            // Trigger load se già in cache
            if ($cropImage[0].complete) {
                $cropImage.trigger('load');
            }
        });
        
        // Chiudi modal
        $('#icp-crop-close, #icp-crop-cancel').on('click', function() {
            if (cropJcropApi) {
                cropJcropApi.destroy();
                cropJcropApi = null;
            }
            $cropModal.hide();
            cropCurrentId = null;
            cropCoords = null;
        });
        
        // Applica ritaglio
        $('#icp-crop-save').on('click', function() {
            if (!cropCoords || !cropCurrentId) {
                alert('Seleziona un\'area da ritagliare.');
                return;
            }
            
            if (cropCoords.w <= 0 || cropCoords.h <= 0) {
                alert('L\'area selezionata non è valida.');
                return;
            }
            
            var $btn = $(this);
            $btn.prop('disabled', true).text('Ritaglio in corso...');
            
            $.ajax({
                url: icpAjax.url,
                type: 'POST',
                data: {
                    action: 'icp_crop_image',
                    nonce: icpAjax.nonce,
                    image_id: cropCurrentId,
                    crop_x: Math.round(cropCoords.x),
                    crop_y: Math.round(cropCoords.y),
                    crop_w: Math.round(cropCoords.w),
                    crop_h: Math.round(cropCoords.h)
                },
                success: function(response) {
                    $btn.prop('disabled', false).text('Applica ritaglio');
                    
                    if (response.success) {
                        // Aggiorna thumbnail nella griglia
                        var $item = $('.icp-image-item[data-id="' + cropCurrentId + '"]');
                        $item.find('img').attr('src', response.data.url);
                        
                        // Aggiorna data-url sul bottone crop
                        $item.find('.icp-crop-image').data('url', response.data.url);
                        
                        // Chiudi modal
                        if (cropJcropApi) {
                            cropJcropApi.destroy();
                            cropJcropApi = null;
                        }
                        $cropModal.hide();
                        cropCurrentId = null;
                        cropCoords = null;
                    } else {
                        alert('Errore: ' + response.data);
                    }
                },
                error: function() {
                    $btn.prop('disabled', false).text('Applica ritaglio');
                    alert('Errore di comunicazione con il server.');
                }
            });
        });
        
        // =============================
        // Preview live
        // =============================
        var $previewFrame = $('#icp-preview-frame');
        var $previewStatus = $('#icp-preview-status');
        var $refreshBtn = $('#icp-refresh-preview');
        
        function loadPreview() {
            if ($previewFrame.length === 0) return;
            
            $previewStatus.text('Caricamento...');
            
            // Costruisce URL con nonce per l'endpoint AJAX
            var previewUrl = icpAjax.url + '?action=icp_preview&nonce=' + icpAjax.nonce + '&t=' + Date.now();
            
            $previewFrame.attr('src', previewUrl);
            
            $previewFrame.off('load').on('load', function() {
                $previewStatus.text('');
                
                // Adatta altezza iframe al contenuto
                try {
                    var innerDoc = this.contentDocument || this.contentWindow.document;
                    var contentHeight = innerDoc.body.scrollHeight;
                    if (contentHeight > 100) {
                        $(this).css('min-height', Math.min(contentHeight + 40, 600) + 'px');
                    }
                } catch(e) {
                    // Cross-origin, ignora
                }
            });
        }
        
        // Carica preview all'apertura della pagina
        loadPreview();
        
        // Bottone aggiorna manuale
        $refreshBtn.on('click', function(e) {
            e.preventDefault();
            loadPreview();
        });
        
        // Ricarica preview dopo il salvataggio impostazioni (la pagina si ricarica con POST)
        // Ricarica anche dopo aggiunta/cancellazione/riordino immagini
        $(document).ajaxComplete(function(event, xhr, settings) {
            if (settings.data && typeof settings.data === 'string') {
                var isRelevant = settings.data.indexOf('icp_upload_image') !== -1 ||
                                 settings.data.indexOf('icp_upload_video') !== -1 ||
                                 settings.data.indexOf('icp_delete_image') !== -1 ||
                                 settings.data.indexOf('icp_reorder_images') !== -1 ||
                                 settings.data.indexOf('icp_crop_image') !== -1;
                if (isRelevant) {
                    // Piccolo ritardo per assicurarsi che il DB sia aggiornato
                    setTimeout(loadPreview, 500);
                }
            }
        });
    });
    
})(jQuery);