<?php
/**
 * Plugin Name: Image Carousel Pro
 * Description: Carosello immagini/video con rotazione automatica e zoom centrale
 * Version: 1.4.0
 * Author: Davide "The Prof." Bertolino
 * Author URI: https://www.davidebertolino.it
 * Text Domain: image-carousel-pro
 */

if (!defined('ABSPATH')) exit;

class ImageCarouselPro {
    
    private $upload_dir = 'carousel-images';
    private static $instance_count = 0;
    
    private $allowed_video_types = ['video/mp4', 'video/webm', 'video/ogg'];
    
    private $default_settings = [
        'interval'              => 3000,
        'transition'            => 500,
        'zoom_scale'            => 1.3,
        'autoplay_video'        => 0,
        'border_color'          => '#0073aa',
        'border_color_inactive' => '',
        'border_width'          => 3,
        'border_radius'         => 12,
        'slide_width'           => 250,
        'slide_height'          => 180,
        'container_height'      => 0,
        'container_border_color'  => '',
        'container_border_width'  => 0,
        'container_border_radius' => 0,
        'container_padding'       => 0,
        'container_max_width'     => 1200,
        'show_shadow'             => 1,
        'image_fit'               => 'cover',
        'mode'                  => 'carousel',
        'effect'                => 'fade',
        'minimal'               => 0
    ];
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'admin_scripts']);
        add_action('wp_enqueue_scripts', [$this, 'frontend_scripts']);
        add_action('wp_ajax_icp_upload_image', [$this, 'handle_upload']);
        add_action('wp_ajax_icp_upload_video', [$this, 'handle_upload_video']);
        add_action('wp_ajax_icp_delete_image', [$this, 'handle_delete']);
        add_action('wp_ajax_icp_reorder_images', [$this, 'handle_reorder']);
        add_action('wp_ajax_icp_save_caption', [$this, 'handle_save_caption']);
        add_action('wp_ajax_icp_save_tags', [$this, 'handle_save_tags']);
        add_shortcode('image_carousel', [$this, 'render_shortcode']);
        
        register_activation_hook(__FILE__, [$this, 'activate']);
    }
    
    public function activate() {
        $upload = wp_upload_dir();
        $dir = $upload['basedir'] . '/' . $this->upload_dir;
        if (!file_exists($dir)) wp_mkdir_p($dir);
        
        if (get_option('icp_images') === false) add_option('icp_images', []);
        if (get_option('icp_settings') === false) add_option('icp_settings', $this->default_settings);
    }
    
    private function get_settings() {
        return wp_parse_args(get_option('icp_settings', []), $this->default_settings);
    }
    
    public function add_admin_menu() {
        add_menu_page('Image Carousel Pro', 'Carousel Pro', 'manage_options', 'image-carousel-pro', [$this, 'admin_page'], 'dashicons-images-alt2', 30);
    }
    
    public function admin_scripts($hook) {
        if ($hook !== 'toplevel_page_image-carousel-pro') return;
        wp_enqueue_media();
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_style('icp-admin', plugins_url('css/admin.css', __FILE__), [], '1.4.0');
        wp_enqueue_script('icp-admin', plugins_url('js/admin.js', __FILE__), ['jquery', 'jquery-ui-sortable', 'wp-color-picker'], '1.4.0', true);
        wp_localize_script('icp-admin', 'icpAjax', [
            'url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('icp_nonce')
        ]);
    }
    
    public function frontend_scripts() {
        wp_enqueue_style('icp-frontend', plugins_url('css/frontend.css', __FILE__), [], '1.4.0');
        wp_enqueue_script('icp-frontend', plugins_url('js/frontend.js', __FILE__), [], '1.4.0', true);
    }
    
    public function admin_page() {
        $images = get_option('icp_images', []);
        $settings = $this->get_settings();
        
        if (isset($_POST['icp_save_settings']) && wp_verify_nonce($_POST['icp_nonce'], 'icp_settings')) {
            $settings = [
                'interval'              => absint($_POST['interval']),
                'transition'            => absint($_POST['transition']),
                'zoom_scale'            => floatval($_POST['zoom_scale']),
                'autoplay_video'        => isset($_POST['autoplay_video']) ? 1 : 0,
                'border_color'          => sanitize_hex_color($_POST['border_color']) ?: '#0073aa',
                'border_color_inactive' => sanitize_hex_color($_POST['border_color_inactive']) ?: '',
                'border_width'          => absint($_POST['border_width']),
                'border_radius'         => absint($_POST['border_radius']),
                'slide_width'           => max(80, absint($_POST['slide_width'])),
                'slide_height'          => max(60, absint($_POST['slide_height'])),
                'container_height'      => absint($_POST['container_height']),
                'container_border_color'  => sanitize_hex_color($_POST['container_border_color']) ?: '',
                'container_border_width'  => absint($_POST['container_border_width']),
                'container_border_radius' => absint($_POST['container_border_radius']),
                'container_padding'       => absint($_POST['container_padding']),
                'container_max_width'     => absint($_POST['container_max_width']),
                'show_shadow'             => isset($_POST['show_shadow']) ? 1 : 0,
                'image_fit'               => in_array($_POST['image_fit'], ['cover', 'contain', 'fill']) ? $_POST['image_fit'] : 'cover',
                'mode'                  => in_array($_POST['mode'], ['carousel', 'single']) ? $_POST['mode'] : 'carousel',
                'effect'                => in_array($_POST['effect'], ['fade', 'slide', 'flip', 'zoom']) ? $_POST['effect'] : 'fade',
                'minimal'               => isset($_POST['minimal']) ? 1 : 0
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
                            <tr>
                                <th>Autoplay video (mutato)</th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="autoplay_video" value="1" <?php checked($settings['autoplay_video'], 1); ?>>
                                        Avvia automaticamente i video quando la slide è attiva
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <th>Colore bordo slide attiva</th>
                                <td><input type="text" name="border_color" value="<?php echo esc_attr($settings['border_color']); ?>" class="icp-color-picker"></td>
                            </tr>
                            <tr>
                                <th>Colore bordo slide inattive</th>
                                <td>
                                    <input type="text" name="border_color_inactive" value="<?php echo esc_attr($settings['border_color_inactive']); ?>" class="icp-color-picker">
                                    <p class="description">Lascia vuoto per trasparente.</p>
                                </td>
                            </tr>
                            <tr>
                                <th>Spessore bordo (px)</th>
                                <td><input type="number" name="border_width" value="<?php echo esc_attr($settings['border_width']); ?>" min="0" max="10" step="1"></td>
                            </tr>
                            <tr>
                                <th>Angoli arrotondati (px)</th>
                                <td><input type="number" name="border_radius" value="<?php echo esc_attr($settings['border_radius']); ?>" min="0" max="50" step="1"></td>
                            </tr>
                            <tr>
                                <th>Larghezza slide (px)</th>
                                <td>
                                    <input type="number" name="slide_width" value="<?php echo esc_attr($settings['slide_width']); ?>" min="80" max="600" step="10">
                                    <p class="description">Il numero di slide visibili si adatta alla larghezza del contenitore.</p>
                                </td>
                            </tr>
                            <tr>
                                <th>Altezza slide (px)</th>
                                <td><input type="number" name="slide_height" value="<?php echo esc_attr($settings['slide_height']); ?>" min="60" max="600" step="10"></td>
                            </tr>
                            <tr>
                                <th>Altezza contenitore (px)</th>
                                <td>
                                    <input type="number" name="container_height" value="<?php echo esc_attr($settings['container_height']); ?>" min="0" max="1000" step="10">
                                    <p class="description">0 = automatica (si adatta al contenuto).</p>
                                </td>
                            </tr>
                            <tr>
                                <th>Bordo contenitore — colore</th>
                                <td>
                                    <input type="text" name="container_border_color" value="<?php echo esc_attr($settings['container_border_color']); ?>" class="icp-color-picker">
                                    <p class="description">Lascia vuoto per nessun bordo.</p>
                                </td>
                            </tr>
                            <tr>
                                <th>Bordo contenitore — spessore (px)</th>
                                <td><input type="number" name="container_border_width" value="<?php echo esc_attr($settings['container_border_width']); ?>" min="0" max="10" step="1"></td>
                            </tr>
                            <tr>
                                <th>Bordo contenitore — angoli (px)</th>
                                <td><input type="number" name="container_border_radius" value="<?php echo esc_attr($settings['container_border_radius']); ?>" min="0" max="50" step="1"></td>
                            </tr>
                            <tr>
                                <th>Padding contenitore (px)</th>
                                <td>
                                    <input type="number" name="container_padding" value="<?php echo esc_attr($settings['container_padding']); ?>" min="0" max="100" step="5">
                                    <p class="description">Spazio interno tra il bordo e il carousel.</p>
                                </td>
                            </tr>
                            <tr>
                                <th>Larghezza massima contenitore (px)</th>
                                <td>
                                    <input type="number" name="container_max_width" value="<?php echo esc_attr($settings['container_max_width']); ?>" min="0" max="3000" step="10">
                                    <p class="description">0 = piena larghezza (100%).</p>
                                </td>
                            </tr>
                            <tr>
                                <th>Ombra slide</th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="show_shadow" value="1" <?php checked($settings['show_shadow'], 1); ?>>
                                        Mostra ombra sulle slide
                                    </label>
                                </td>
                            </tr>
                            <tr>
                                <th>Adattamento immagine</th>
                                <td>
                                    <select name="image_fit">
                                        <option value="cover" <?php selected($settings['image_fit'], 'cover'); ?>>Riempi (taglia se necessario)</option>
                                        <option value="contain" <?php selected($settings['image_fit'], 'contain'); ?>>Adatta (mostra tutta, possibili bande)</option>
                                        <option value="fill" <?php selected($settings['image_fit'], 'fill'); ?>>Stira (deforma per riempire)</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th>Modalità layout</th>
                                <td>
                                    <select name="mode">
                                        <option value="carousel" <?php selected($settings['mode'], 'carousel'); ?>>Carousel (multi-slide)</option>
                                        <option value="single" <?php selected($settings['mode'], 'single'); ?>>Singola slide</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th>Effetto transizione (modalità singola)</th>
                                <td>
                                    <select name="effect">
                                        <option value="fade" <?php selected($settings['effect'], 'fade'); ?>>Fade (dissolvenza)</option>
                                        <option value="slide" <?php selected($settings['effect'], 'slide'); ?>>Slide (scorrimento)</option>
                                        <option value="flip" <?php selected($settings['effect'], 'flip'); ?>>Flip (rotazione 3D)</option>
                                        <option value="zoom" <?php selected($settings['effect'], 'zoom'); ?>>Zoom (scala)</option>
                                    </select>
                                    <p class="description">Usato solo in modalità "Singola slide".</p>
                                </td>
                            </tr>
                            <tr>
                                <th>Modalità minimal</th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="minimal" value="1" <?php checked($settings['minimal'], 1); ?>>
                                        Nasconde frecce, dots, fullscreen. Disabilita click e navigazione manuale.
                                    </label>
                                </td>
                            </tr>
                        </table>
                        <p><input type="submit" name="icp_save_settings" class="button button-primary" value="Salva Impostazioni"></p>
                    </form>
                </div>
                
                <div class="icp-section">
                    <h2>Gestione Media</h2>
                    <p>
                        <button type="button" id="icp-add-image" class="button button-primary">Aggiungi Immagine</button>
                        <button type="button" id="icp-add-video" class="button button-secondary">Aggiungi Video</button>
                    </p>
                    
                    <div id="icp-images-list" class="icp-images-grid">
                        <?php foreach ($images as $index => $image): 
                            $is_video = isset($image['type']) && $image['type'] === 'video';
                        ?>
                        <div class="icp-image-item <?php echo $is_video ? 'icp-video-item' : ''; ?>" data-id="<?php echo esc_attr($image['id']); ?>">
                            <?php if ($is_video): ?>
                                <div class="icp-video-thumb">
                                    <span class="dashicons dashicons-video-alt3"></span>
                                    <span class="icp-video-filename"><?php echo esc_html(basename($image['url'])); ?></span>
                                </div>
                            <?php else: ?>
                                <img src="<?php echo esc_url($image['url']); ?>" alt="">
                            <?php endif; ?>
                            <div class="icp-image-actions">
                                <span class="dashicons dashicons-move icp-drag-handle"></span>
                                <button type="button" class="icp-delete-image" data-id="<?php echo esc_attr($image['id']); ?>">
                                    <span class="dashicons dashicons-trash"></span>
                                </button>
                            </div>
                            <div class="icp-image-meta">
                                <input type="text" class="icp-caption-input" data-id="<?php echo esc_attr($image['id']); ?>" 
                                       value="<?php echo esc_attr(isset($image['caption']) ? $image['caption'] : ''); ?>" 
                                       placeholder="Didascalia...">
                                <input type="text" class="icp-tags-input" data-id="<?php echo esc_attr($image['id']); ?>" 
                                       value="<?php echo esc_attr(isset($image['tags']) ? $image['tags'] : ''); ?>" 
                                       placeholder="Tag (es: natura, mare, montagna)">
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <div class="icp-section">
                    <h2>Shortcode</h2>
                    <code>[image_carousel]</code>
                    <p class="description">Inserisci questo shortcode in qualsiasi pagina o post.</p>
                    <h3>Parametri disponibili</h3>
                    <table class="widefat striped" style="max-width:800px;">
                        <thead>
                            <tr><th>Parametro</th><th>Valori</th><th>Default</th></tr>
                        </thead>
                        <tbody>
                            <tr><td><code>interval</code></td><td>ms (es: 3000)</td><td><?php echo esc_html($settings['interval']); ?></td></tr>
                            <tr><td><code>transition</code></td><td>ms (es: 500)</td><td><?php echo esc_html($settings['transition']); ?></td></tr>
                            <tr><td><code>zoom</code></td><td>1.0 – 2.0</td><td><?php echo esc_html($settings['zoom_scale']); ?></td></tr>
                            <tr><td><code>category</code></td><td>nome tag</td><td>—</td></tr>
                            <tr><td><code>mode</code></td><td>carousel | single</td><td><?php echo esc_html($settings['mode']); ?></td></tr>
                            <tr><td><code>effect</code></td><td>fade | slide | flip | zoom</td><td><?php echo esc_html($settings['effect']); ?></td></tr>
                            <tr><td><code>border_color</code></td><td>hex (es: #0073aa)</td><td><?php echo esc_html($settings['border_color']); ?></td></tr>
                            <tr><td><code>border_color_inactive</code></td><td>hex o vuoto</td><td><?php echo esc_html($settings['border_color_inactive'] ?: 'trasparente'); ?></td></tr>
                            <tr><td><code>border_width</code></td><td>px (0–10)</td><td><?php echo esc_html($settings['border_width']); ?></td></tr>
                            <tr><td><code>border_radius</code></td><td>px (0–50)</td><td><?php echo esc_html($settings['border_radius']); ?></td></tr>
                            <tr><td><code>slide_width</code></td><td>px (80–600)</td><td><?php echo esc_html($settings['slide_width']); ?></td></tr>
                            <tr><td><code>slide_height</code></td><td>px (60–600)</td><td><?php echo esc_html($settings['slide_height']); ?></td></tr>
                            <tr><td><code>container_height</code></td><td>px (0 = auto)</td><td><?php echo esc_html($settings['container_height']); ?></td></tr>
                            <tr><td><code>container_border_color</code></td><td>hex o vuoto</td><td><?php echo esc_html($settings['container_border_color'] ?: 'nessuno'); ?></td></tr>
                            <tr><td><code>container_border_width</code></td><td>px (0–10)</td><td><?php echo esc_html($settings['container_border_width']); ?></td></tr>
                            <tr><td><code>container_border_radius</code></td><td>px (0–50)</td><td><?php echo esc_html($settings['container_border_radius']); ?></td></tr>
                            <tr><td><code>container_padding</code></td><td>px (0–100)</td><td><?php echo esc_html($settings['container_padding']); ?></td></tr>
                            <tr><td><code>container_max_width</code></td><td>px (0 = 100%)</td><td><?php echo esc_html($settings['container_max_width']); ?></td></tr>
                            <tr><td><code>show_shadow</code></td><td>0 | 1</td><td><?php echo esc_html($settings['show_shadow']); ?></td></tr>
                            <tr><td><code>image_fit</code></td><td>cover | contain | fill</td><td><?php echo esc_html($settings['image_fit']); ?></td></tr>
                            <tr><td><code>minimal</code></td><td>0 | 1</td><td><?php echo esc_html($settings['minimal']); ?></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <?php
    }
    
    // === AJAX handlers (invariati da v1.3) ===
    
    public function handle_upload() {
        check_ajax_referer('icp_nonce', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error('Permessi insufficienti');
        $attachment_id = absint($_POST['attachment_id']);
        $attachment_url = wp_get_attachment_url($attachment_id);
        if (!$attachment_url) wp_send_json_error('Immagine non valida');
        $upload = wp_upload_dir();
        $source = get_attached_file($attachment_id);
        $filename = basename($source);
        $dest_dir = $upload['basedir'] . '/' . $this->upload_dir;
        $dest_file = $dest_dir . '/' . $filename;
        if (!file_exists($dest_dir)) wp_mkdir_p($dest_dir);
        copy($source, $dest_file);
        $image_url = $upload['baseurl'] . '/' . $this->upload_dir . '/' . $filename;
        $images = get_option('icp_images', []);
        $new_id = uniqid('icp_');
        $images[] = ['id' => $new_id, 'url' => $image_url, 'file' => $dest_file, 'type' => 'image', 'caption' => '', 'tags' => ''];
        update_option('icp_images', $images);
        wp_send_json_success(['id' => $new_id, 'url' => $image_url, 'type' => 'image']);
    }
    
    public function handle_upload_video() {
        check_ajax_referer('icp_nonce', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error('Permessi insufficienti');
        $attachment_id = absint($_POST['attachment_id']);
        $mime_type = get_post_mime_type($attachment_id);
        if (!in_array($mime_type, $this->allowed_video_types)) wp_send_json_error('Formato video non supportato. Usa MP4, WebM o OGG.');
        $attachment_url = wp_get_attachment_url($attachment_id);
        if (!$attachment_url) wp_send_json_error('Video non valido');
        $upload = wp_upload_dir();
        $source = get_attached_file($attachment_id);
        $filename = basename($source);
        $dest_dir = $upload['basedir'] . '/' . $this->upload_dir;
        $dest_file = $dest_dir . '/' . $filename;
        if (!file_exists($dest_dir)) wp_mkdir_p($dest_dir);
        copy($source, $dest_file);
        $video_url = $upload['baseurl'] . '/' . $this->upload_dir . '/' . $filename;
        $images = get_option('icp_images', []);
        $new_id = uniqid('icp_');
        $images[] = ['id' => $new_id, 'url' => $video_url, 'file' => $dest_file, 'type' => 'video', 'mime' => $mime_type, 'caption' => '', 'tags' => ''];
        update_option('icp_images', $images);
        wp_send_json_success(['id' => $new_id, 'url' => $video_url, 'type' => 'video', 'filename' => $filename]);
    }
    
    public function handle_delete() {
        check_ajax_referer('icp_nonce', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error('Permessi insufficienti');
        $id = sanitize_text_field($_POST['image_id']);
        $images = get_option('icp_images', []);
        foreach ($images as $key => $image) {
            if ($image['id'] === $id) {
                if (file_exists($image['file'])) unlink($image['file']);
                unset($images[$key]); break;
            }
        }
        update_option('icp_images', array_values($images));
        wp_send_json_success();
    }
    
    public function handle_reorder() {
        check_ajax_referer('icp_nonce', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error('Permessi insufficienti');
        if (!isset($_POST['order']) || !is_array($_POST['order'])) wp_send_json_error('Dati non validi');
        $order = array_map('sanitize_text_field', $_POST['order']);
        $images = get_option('icp_images', []);
        $reordered = [];
        foreach ($order as $id) { foreach ($images as $image) { if ($image['id'] === $id) { $reordered[] = $image; break; } } }
        update_option('icp_images', $reordered);
        wp_send_json_success();
    }
    
    public function handle_save_caption() {
        check_ajax_referer('icp_nonce', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error('Permessi insufficienti');
        $id = sanitize_text_field($_POST['image_id']);
        $caption = sanitize_text_field($_POST['caption']);
        $images = get_option('icp_images', []);
        foreach ($images as &$image) { if ($image['id'] === $id) { $image['caption'] = $caption; break; } }
        update_option('icp_images', $images);
        wp_send_json_success();
    }
    
    public function handle_save_tags() {
        check_ajax_referer('icp_nonce', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error('Permessi insufficienti');
        $id = sanitize_text_field($_POST['image_id']);
        $tags = sanitize_text_field($_POST['tags']);
        $images = get_option('icp_images', []);
        foreach ($images as &$image) { if ($image['id'] === $id) { $image['tags'] = $tags; break; } }
        update_option('icp_images', $images);
        wp_send_json_success();
    }
    
    // === Helpers ===
    
    private function parse_tags($tag_string) {
        if (empty($tag_string)) return [];
        return array_filter(array_map('trim', explode(',', strtolower($tag_string))));
    }
    
    private function collect_all_tags($images) {
        $all_tags = [];
        foreach ($images as $image) {
            foreach ($this->parse_tags(isset($image['tags']) ? $image['tags'] : '') as $tag) {
                if (!in_array($tag, $all_tags)) $all_tags[] = $tag;
            }
        }
        sort($all_tags);
        return $all_tags;
    }
    
    // === Shortcode ===
    
    public function render_shortcode($atts) {
        $images = get_option('icp_images', []);
        $settings = $this->get_settings();
        
        if (empty($images)) return '<p class="icp-no-images">Nessuna immagine nel carosello.</p>';
        
        self::$instance_count++;
        $lightbox_id = 'icp-lightbox-' . self::$instance_count;
        $fullscreen_id = 'icp-fullscreen-' . self::$instance_count;
        
        $atts = shortcode_atts([
            'interval'              => $settings['interval'],
            'transition'            => $settings['transition'],
            'zoom'                  => $settings['zoom_scale'],
            'category'              => '',
            'border_color'          => $settings['border_color'],
            'border_color_inactive' => $settings['border_color_inactive'],
            'border_width'          => $settings['border_width'],
            'border_radius'         => $settings['border_radius'],
            'slide_width'           => $settings['slide_width'],
            'slide_height'          => $settings['slide_height'],
            'container_height'      => $settings['container_height'],
            'container_border_color'  => $settings['container_border_color'],
            'container_border_width'  => $settings['container_border_width'],
            'container_border_radius' => $settings['container_border_radius'],
            'container_padding'       => $settings['container_padding'],
            'container_max_width'     => $settings['container_max_width'],
            'show_shadow'             => $settings['show_shadow'],
            'image_fit'               => $settings['image_fit'],
            'mode'                  => $settings['mode'],
            'effect'                => $settings['effect'],
            'minimal'               => $settings['minimal']
        ], $atts);
        
        $mode = in_array($atts['mode'], ['carousel', 'single']) ? $atts['mode'] : 'carousel';
        $effect = in_array($atts['effect'], ['fade', 'slide', 'flip', 'zoom']) ? $atts['effect'] : 'fade';
        
        // Filtra per categoria
        $shortcode_category = strtolower(trim($atts['category']));
        if (!empty($shortcode_category)) {
            $images = array_values(array_filter($images, function($img) use ($shortcode_category) {
                return in_array($shortcode_category, $this->parse_tags(isset($img['tags']) ? $img['tags'] : ''));
            }));
        }
        if (empty($images)) return '<p class="icp-no-images">Nessuna immagine per questa categoria.</p>';
        
        $all_tags = $this->collect_all_tags($images);
        $show_filters = !empty($all_tags) && empty($shortcode_category);
        $original_count = count($images);
        
        if ($mode === 'carousel' && $original_count < 3) {
            $src = $images;
            while (count($images) < 3) { foreach ($src as $img) { $images[] = $img; if (count($images) >= 3) break; } }
        }
        
        $autoplay_video = !empty($settings['autoplay_video']) ? '1' : '0';
        $border_inactive = !empty($atts['border_color_inactive']) ? $atts['border_color_inactive'] : 'transparent';
        
        ob_start();
        ?>
        <?php 
        $wrapper_max_width = absint($atts['container_max_width']);
        $wrapper_style = $wrapper_max_width > 0 ? 'max-width:' . $wrapper_max_width . 'px; margin:0 auto;' : '';
        ?>
        <div class="icp-carousel-wrapper" style="<?php echo esc_attr($wrapper_style); ?>">
            <?php if ($show_filters): ?>
            <div class="icp-filter-bar">
                <button class="icp-filter-btn icp-filter-active" data-filter="*">Tutti</button>
                <?php foreach ($all_tags as $tag): ?>
                <button class="icp-filter-btn" data-filter="<?php echo esc_attr($tag); ?>"><?php echo esc_html(ucfirst($tag)); ?></button>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
            
            <?php $is_minimal = !empty($atts['minimal']) && $atts['minimal'] !== '0'; ?>
            <div class="icp-carousel <?php echo $mode === 'single' ? 'icp-mode-single' : 'icp-mode-carousel'; ?> <?php echo $is_minimal ? 'icp-minimal' : ''; ?>" 
                 data-interval="<?php echo esc_attr($atts['interval']); ?>"
                 data-transition="<?php echo esc_attr($atts['transition']); ?>"
                 data-zoom="<?php echo esc_attr($atts['zoom']); ?>"
                 data-lightbox="<?php echo esc_attr($lightbox_id); ?>"
                 data-fullscreen="<?php echo esc_attr($fullscreen_id); ?>"
                 data-total="<?php echo esc_attr($original_count); ?>"
                 data-autoplay-video="<?php echo esc_attr($autoplay_video); ?>"
                 data-mode="<?php echo esc_attr($mode); ?>"
                 data-effect="<?php echo esc_attr($effect); ?>"
                 data-minimal="<?php echo $is_minimal ? '1' : '0'; ?>"
                 data-border-color="<?php echo esc_attr($atts['border_color']); ?>"
                 data-border-color-inactive="<?php echo esc_attr($border_inactive); ?>"
                 data-border-width="<?php echo esc_attr($atts['border_width']); ?>"
                 data-border-radius="<?php echo esc_attr($atts['border_radius']); ?>"
                 data-slide-width="<?php echo esc_attr($atts['slide_width']); ?>"
                 data-slide-height="<?php echo esc_attr($atts['slide_height']); ?>"
                 data-container-height="<?php echo esc_attr($atts['container_height']); ?>"
                 data-container-border-color="<?php echo esc_attr($atts['container_border_color']); ?>"
                 data-container-border-width="<?php echo esc_attr($atts['container_border_width']); ?>"
                 data-container-border-radius="<?php echo esc_attr($atts['container_border_radius']); ?>"
                 data-container-padding="<?php echo esc_attr($atts['container_padding']); ?>"
                 data-show-shadow="<?php echo !empty($atts['show_shadow']) && $atts['show_shadow'] !== '0' ? '1' : '0'; ?>"
                 data-image-fit="<?php echo esc_attr($atts['image_fit']); ?>">
                <div class="icp-carousel-track">
                    <?php foreach ($images as $index => $image): 
                        $slide_tags = $this->parse_tags(isset($image['tags']) ? $image['tags'] : '');
                        $is_video = isset($image['type']) && $image['type'] === 'video';
                    ?>
                    <div class="icp-carousel-slide <?php echo $index === 0 ? 'icp-active' : ''; ?> <?php echo $is_video ? 'icp-slide-video' : ''; ?>" 
                         data-full="<?php echo esc_url($image['url']); ?>"
                         data-tags="<?php echo esc_attr(implode(',', $slide_tags)); ?>"
                         <?php if ($is_video): ?>data-type="video"<?php endif; ?>>
                        <?php if ($is_video): ?>
                            <video class="icp-slide-video-el" muted loop playsinline preload="metadata">
                                <source src="<?php echo esc_url($image['url']); ?>" type="<?php echo esc_attr($image['mime']); ?>">
                            </video>
                            <div class="icp-video-play-overlay"><span class="icp-play-icon">&#9654;</span></div>
                        <?php else: ?>
                            <img src="<?php echo esc_url($image['url']); ?>" alt="<?php echo esc_attr(isset($image['caption']) ? $image['caption'] : ''); ?>" loading="lazy">
                        <?php endif; ?>
                        <?php if (!empty($image['caption'])): ?>
                        <div class="icp-slide-caption"><?php echo esc_html($image['caption']); ?></div>
                        <?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                </div>
                <div class="icp-carousel-nav">
                    <button class="icp-nav-prev" aria-label="Precedente">&#8249;</button>
                    <button class="icp-nav-fullscreen" aria-label="Schermo intero">&#x26F6;</button>
                    <button class="icp-nav-next" aria-label="Successivo">&#8250;</button>
                </div>
                <div class="icp-carousel-dots">
                    <?php for ($i = 0; $i < $original_count; $i++): ?>
                    <button class="icp-dot <?php echo $i === 0 ? 'icp-active' : ''; ?>" data-index="<?php echo $i; ?>"></button>
                    <?php endfor; ?>
                </div>
            </div>
            
            <div class="icp-lightbox" id="<?php echo esc_attr($lightbox_id); ?>">
                <button class="icp-lightbox-close" aria-label="Chiudi">&times;</button>
                <img src="" alt="" class="icp-lightbox-img">
                <div class="icp-lightbox-caption"></div>
            </div>
            
            <div class="icp-fullscreen" id="<?php echo esc_attr($fullscreen_id); ?>">
                <button class="icp-fullscreen-close" aria-label="Chiudi">&times;</button>
                <img src="" alt="" class="icp-fullscreen-img">
                <div class="icp-fullscreen-caption"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

new ImageCarouselPro();