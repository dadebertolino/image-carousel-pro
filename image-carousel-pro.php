<?php
/**
 * Plugin Name: Image Carousel Pro
 * Description: Carosello immagini con rotazione automatica e zoom centrale
 * Version: 1.0.0
 * Author: Davide "The Prof." Bertolino
 * Author URI: https://www.davidebertolino.it
 * Text Domain: image-carousel-pro
 */

if (!defined('ABSPATH')) exit;

class ImageCarouselPro {
    
    private $upload_dir = 'carousel-images';
    private static $instance_count = 0;
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'admin_scripts']);
        add_action('wp_enqueue_scripts', [$this, 'frontend_scripts']);
        add_action('wp_ajax_icp_upload_image', [$this, 'handle_upload']);
        add_action('wp_ajax_icp_delete_image', [$this, 'handle_delete']);
        add_action('wp_ajax_icp_reorder_images', [$this, 'handle_reorder']);
        add_action('wp_ajax_icp_save_caption', [$this, 'handle_save_caption']);
        add_shortcode('image_carousel', [$this, 'render_shortcode']);
        
        register_activation_hook(__FILE__, [$this, 'activate']);
    }
    
    public function activate() {
        $upload = wp_upload_dir();
        $dir = $upload['basedir'] . '/' . $this->upload_dir;
        if (!file_exists($dir)) {
            wp_mkdir_p($dir);
        }
        
        if (get_option('icp_images') === false) {
            add_option('icp_images', []);
        }
        if (get_option('icp_settings') === false) {
            add_option('icp_settings', [
                'interval' => 3000,
                'transition' => 500,
                'zoom_scale' => 1.3
            ]);
        }
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Image Carousel Pro',
            'Carousel Pro',
            'manage_options',
            'image-carousel-pro',
            [$this, 'admin_page'],
            'dashicons-images-alt2',
            30
        );
    }
    
    public function admin_scripts($hook) {
        if ($hook !== 'toplevel_page_image-carousel-pro') return;
        
        wp_enqueue_media();
        wp_enqueue_style('icp-admin', plugins_url('css/admin.css', __FILE__), [], '1.0.0');
        wp_enqueue_script('icp-admin', plugins_url('js/admin.js', __FILE__), ['jquery', 'jquery-ui-sortable'], '1.0.0', true);
        wp_localize_script('icp-admin', 'icpAjax', [
            'url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('icp_nonce')
        ]);
    }
    
    public function frontend_scripts() {
        wp_enqueue_style('icp-frontend', plugins_url('css/frontend.css', __FILE__), [], '1.0.0');
        wp_enqueue_script('icp-frontend', plugins_url('js/frontend.js', __FILE__), [], '1.0.0', true);
    }
    
    public function admin_page() {
        $images = get_option('icp_images', []);
        $settings = get_option('icp_settings', [
            'interval' => 3000,
            'transition' => 500,
            'zoom_scale' => 1.3
        ]);
        
        if (isset($_POST['icp_save_settings']) && wp_verify_nonce($_POST['icp_nonce'], 'icp_settings')) {
            $settings = [
                'interval' => absint($_POST['interval']),
                'transition' => absint($_POST['transition']),
                'zoom_scale' => floatval($_POST['zoom_scale'])
            ];
            update_option('icp_settings', $settings);
            echo '<div class="notice notice-success"><p>Impostazioni salvate!</p></div>';
        }
        ?>
        <div class="wrap icp-admin">
            <h1>Image Carousel Pro</h1>
            
            <div class="icp-container">
                <div class="icp-section">
                    <h2>Impostazioni</h2>
                    <form method="post">
                        <?php wp_nonce_field('icp_settings', 'icp_nonce'); ?>
                        <table class="form-table">
                            <tr>
                                <th>Intervallo rotazione (ms)</th>
                                <td><input type="number" name="interval" value="<?php echo esc_attr($settings['interval']); ?>" min="1000" step="100"></td>
                            </tr>
                            <tr>
                                <th>Durata transizione (ms)</th>
                                <td><input type="number" name="transition" value="<?php echo esc_attr($settings['transition']); ?>" min="100" step="50"></td>
                            </tr>
                            <tr>
                                <th>Scala zoom centrale</th>
                                <td><input type="number" name="zoom_scale" value="<?php echo esc_attr($settings['zoom_scale']); ?>" min="1" max="2" step="0.1"></td>
                            </tr>
                        </table>
                        <p><input type="submit" name="icp_save_settings" class="button button-primary" value="Salva Impostazioni"></p>
                    </form>
                </div>
                
                <div class="icp-section">
                    <h2>Gestione Immagini</h2>
                    <p><button type="button" id="icp-add-image" class="button button-primary">Aggiungi Immagine</button></p>
                    
                    <div id="icp-images-list" class="icp-images-grid">
                        <?php foreach ($images as $index => $image): ?>
                        <div class="icp-image-item" data-id="<?php echo esc_attr($image['id']); ?>">
                            <img src="<?php echo esc_url($image['url']); ?>" alt="">
                            <div class="icp-image-actions">
                                <span class="dashicons dashicons-move icp-drag-handle"></span>
                                <button type="button" class="icp-delete-image" data-id="<?php echo esc_attr($image['id']); ?>">
                                    <span class="dashicons dashicons-trash"></span>
                                </button>
                            </div>
                            <div class="icp-image-caption">
                                <input type="text" class="icp-caption-input" data-id="<?php echo esc_attr($image['id']); ?>" 
                                       value="<?php echo esc_attr(isset($image['caption']) ? $image['caption'] : ''); ?>" 
                                       placeholder="Didascalia...">
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <div class="icp-section">
                    <h2>Shortcode</h2>
                    <code>[image_carousel]</code>
                    <p class="description">Inserisci questo shortcode in qualsiasi pagina o post.</p>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function handle_upload() {
        check_ajax_referer('icp_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permessi insufficienti');
        }
        
        $attachment_id = absint($_POST['attachment_id']);
        $attachment_url = wp_get_attachment_url($attachment_id);
        
        if (!$attachment_url) {
            wp_send_json_error('Immagine non valida');
        }
        
        // Copia nella cartella dedicata
        $upload = wp_upload_dir();
        $source = get_attached_file($attachment_id);
        $filename = basename($source);
        $dest_dir = $upload['basedir'] . '/' . $this->upload_dir;
        $dest_file = $dest_dir . '/' . $filename;
        
        if (!file_exists($dest_dir)) {
            wp_mkdir_p($dest_dir);
        }
        
        copy($source, $dest_file);
        
        $image_url = $upload['baseurl'] . '/' . $this->upload_dir . '/' . $filename;
        
        $images = get_option('icp_images', []);
        $new_id = uniqid('icp_');
        $images[] = [
            'id' => $new_id,
            'url' => $image_url,
            'file' => $dest_file
        ];
        update_option('icp_images', $images);
        
        wp_send_json_success([
            'id' => $new_id,
            'url' => $image_url
        ]);
    }
    
    public function handle_delete() {
        check_ajax_referer('icp_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permessi insufficienti');
        }
        
        $id = sanitize_text_field($_POST['image_id']);
        $images = get_option('icp_images', []);
        
        foreach ($images as $key => $image) {
            if ($image['id'] === $id) {
                if (file_exists($image['file'])) {
                    unlink($image['file']);
                }
                unset($images[$key]);
                break;
            }
        }
        
        $images = array_values($images);
        update_option('icp_images', $images);
        
        wp_send_json_success();
    }
    
    public function handle_reorder() {
        check_ajax_referer('icp_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permessi insufficienti');
        }
        
        if (!isset($_POST['order']) || !is_array($_POST['order'])) {
            wp_send_json_error('Dati non validi');
        }
        $order = array_map('sanitize_text_field', $_POST['order']);
        $images = get_option('icp_images', []);
        $reordered = [];
        
        foreach ($order as $id) {
            foreach ($images as $image) {
                if ($image['id'] === $id) {
                    $reordered[] = $image;
                    break;
                }
            }
        }
        
        update_option('icp_images', $reordered);
        wp_send_json_success();
    }
    
    public function handle_save_caption() {
        check_ajax_referer('icp_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permessi insufficienti');
        }
        
        $id = sanitize_text_field($_POST['image_id']);
        $caption = sanitize_text_field($_POST['caption']);
        $images = get_option('icp_images', []);
        
        foreach ($images as &$image) {
            if ($image['id'] === $id) {
                $image['caption'] = $caption;
                break;
            }
        }
        
        update_option('icp_images', $images);
        wp_send_json_success();
    }
    
    public function render_shortcode($atts) {
        $images = get_option('icp_images', []);
        $settings = get_option('icp_settings', [
            'interval' => 3000,
            'transition' => 500,
            'zoom_scale' => 1.3
        ]);
        
        if (empty($images)) {
            return '<p class="icp-no-images">Nessuna immagine nel carosello.</p>';
        }
        
        self::$instance_count++;
        $instance_id = self::$instance_count;
        $lightbox_id = 'icp-lightbox-' . $instance_id;
        
        // Con meno di 3 immagini il DOM-cloning del JS non funziona:
        // duplichiamo le slide per garantire almeno 3 elementi visibili.
        $min_slides = 3;
        $original_count = count($images);
        if ($original_count < $min_slides) {
            // Ripeti le immagini fino ad averne almeno $min_slides
            while (count($images) < $min_slides) {
                foreach (get_option('icp_images', []) as $img) {
                    $images[] = $img;
                    if (count($images) >= $min_slides) break;
                }
            }
        }
        
        $atts = shortcode_atts([
            'interval' => $settings['interval'],
            'transition' => $settings['transition'],
            'zoom' => $settings['zoom_scale']
        ], $atts);
        
        ob_start();
        ?>
        <div class="icp-carousel" 
             data-interval="<?php echo esc_attr($atts['interval']); ?>"
             data-transition="<?php echo esc_attr($atts['transition']); ?>"
             data-zoom="<?php echo esc_attr($atts['zoom']); ?>"
             data-lightbox="<?php echo esc_attr($lightbox_id); ?>"
             data-total="<?php echo esc_attr($original_count); ?>">
            <div class="icp-carousel-track">
                <?php foreach ($images as $index => $image): ?>
                <div class="icp-carousel-slide <?php echo $index === 0 ? 'icp-active' : ''; ?>" 
                     data-full="<?php echo esc_url($image['url']); ?>">
                    <img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr(isset($image['caption']) ? $image['caption'] : ''); ?>" loading="lazy">
                    <?php if (!empty($image['caption'])): ?>
                    <div class="icp-slide-caption"><?php echo esc_html($image['caption']); ?></div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
            <div class="icp-carousel-nav">
                <button class="icp-nav-prev" aria-label="Precedente">‹</button>
                <button class="icp-nav-next" aria-label="Successivo">›</button>
            </div>
            <div class="icp-carousel-dots">
                <?php for ($i = 0; $i < $original_count; $i++): ?>
                <button class="icp-dot <?php echo $i === 0 ? 'icp-active' : ''; ?>" data-index="<?php echo $i; ?>"></button>
                <?php endfor; ?>
            </div>
        </div>
        
        <!-- Lightbox -->
        <div class="icp-lightbox" id="<?php echo esc_attr($lightbox_id); ?>">
            <button class="icp-lightbox-close" aria-label="Chiudi">&times;</button>
            <img src="" alt="" class="icp-lightbox-img">
            <div class="icp-lightbox-caption"></div>
        </div>
        <?php
        return ob_get_clean();
    }
}

new ImageCarouselPro();
