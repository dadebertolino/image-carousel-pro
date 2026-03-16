(function($) {
    'use strict';

    $(document).ready(function() {
        
        // Media uploader
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
                            var html = '<div class="icp-image-item" data-id="' + response.data.id + '">' +
                                '<img src="' + response.data.url + '" alt="">' +
                                '<div class="icp-image-actions">' +
                                '<span class="dashicons dashicons-move icp-drag-handle"></span>' +
                                '<button type="button" class="icp-delete-image" data-id="' + response.data.id + '">' +
                                '<span class="dashicons dashicons-trash"></span>' +
                                '</button></div>' +
                                '<div class="icp-image-caption">' +
                                '<input type="text" class="icp-caption-input" data-id="' + response.data.id + '" placeholder="Didascalia...">' +
                                '</div></div>';
                            $('#icp-images-list').append(html);
                        } else {
                            alert('Errore: ' + response.data);
                        }
                    }
                });
            });
            
            frame.open();
        });
        
        // Delete image
        $(document).on('click', '.icp-delete-image', function(e) {
            e.preventDefault();
            
            if (!confirm('Eliminare questa immagine?')) return;
            
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
        
        // Save caption on blur
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
        
        // Sortable
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
