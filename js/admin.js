(function($) {
    'use strict';

    $(document).ready(function() {
        
        // Inizializza color picker WordPress
        $('.icp-color-picker').wpColorPicker();
        
        // =============================
        // Media uploader — Immagini
        // =============================
        $('#icp-add-image').on('click', function(e) {
            e.preventDefault();
            
            var frame = wp.media({
                title: 'Seleziona Immagine',
                button: { text: 'Usa questa immagine' },
                multiple: false,
                library: { type: 'image' }
            });
            
            frame.on('select', function() {
                var attachment = frame.state().get('selection').first().toJSON();
                
                $.ajax({
                    url: icpAjax.url,
                    type: 'POST',
                    data: {
                        action: 'icp_upload_image',
                        nonce: icpAjax.nonce,
                        attachment_id: attachment.id
                    },
                    success: function(response) {
                        if (response.success) {
                            $('#icp-images-list').append(
                                buildItemHTML(response.data.id, response.data.url, 'image', '')
                            );
                        } else {
                            alert('Errore: ' + response.data);
                        }
                    }
                });
            });
            
            frame.open();
        });
        
        // =============================
        // Media uploader — Video
        // =============================
        $('#icp-add-video').on('click', function(e) {
            e.preventDefault();
            
            var frame = wp.media({
                title: 'Seleziona Video',
                button: { text: 'Usa questo video' },
                multiple: false,
                library: { type: 'video' }
            });
            
            frame.on('select', function() {
                var attachment = frame.state().get('selection').first().toJSON();
                
                $.ajax({
                    url: icpAjax.url,
                    type: 'POST',
                    data: {
                        action: 'icp_upload_video',
                        nonce: icpAjax.nonce,
                        attachment_id: attachment.id
                    },
                    success: function(response) {
                        if (response.success) {
                            $('#icp-images-list').append(
                                buildItemHTML(response.data.id, response.data.url, 'video', response.data.filename)
                            );
                        } else {
                            alert('Errore: ' + response.data);
                        }
                    }
                });
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
            
            return '<div class="icp-image-item ' + (type === 'video' ? 'icp-video-item' : '') + '" data-id="' + id + '">' +
                mediaHTML +
                '<div class="icp-image-actions">' +
                    '<span class="dashicons dashicons-move icp-drag-handle"></span>' +
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
    });
    
})(jQuery);