<?php
/**
 * Smoke test senza WordPress: carica il plugin con funzioni WP minime simulate ed
 * esegue lo shortcode [image_carousel] su immagini salvate nel formato della 1.0
 * (solo id, url, file: senza type, caption, tags) e nel formato attuale.
 *
 * Uso: php tests/smoke-test.php
 */

error_reporting(E_ALL);
set_error_handler(function ($no, $msg, $file, $line) {
    fwrite(STDERR, "ERRORE: $msg ($file:$line)\n");
    exit(1);
});

define('ABSPATH', sys_get_temp_dir() . '/');

$GLOBALS['icp_options'] = array(
    'icp_images' => array(
        // Formato 1.0
        array('id' => 'a1', 'url' => 'https://example.test/uploads/carousel-images/uno.jpg', 'file' => '/tmp/uno.jpg'),
        // Formato attuale
        array('id' => 'b2', 'url' => 'https://example.test/uploads/carousel-images/due.jpg', 'file' => '/tmp/due.jpg', 'type' => 'image', 'caption' => 'Didascalia', 'tags' => 'eventi'),
        array('id' => 'c3', 'url' => 'https://example.test/uploads/carousel-images/tre.mp4', 'file' => '/tmp/tre.mp4', 'type' => 'video', 'mime' => 'video/mp4', 'caption' => '', 'tags' => ''),
    ),
);

function get_option($k, $d = false) { return $GLOBALS['icp_options'][$k] ?? $d; }
function add_option() {}
function update_option() {}
function add_action() {}
function add_shortcode() {}
function register_activation_hook() {}
function wp_parse_args($a, $d) { return array_merge($d, (array) $a); }
function shortcode_atts($d, $a) { $a = (array) $a; $o = array(); foreach ($d as $k => $v) { $o[$k] = array_key_exists($k, $a) ? $a[$k] : $v; } return $o; }
function esc_attr($s) { return htmlspecialchars((string) $s, ENT_QUOTES); }
function esc_html($s) { return htmlspecialchars((string) $s, ENT_QUOTES); }
function esc_url($s) { return (string) $s; }
function sanitize_text_field($s) { return trim(strip_tags((string) $s)); }
function sanitize_hex_color($s) { return preg_match('/^#[0-9a-f]{3,6}$/i', (string) $s) ? $s : ''; }
function absint($n) { return abs((int) $n); }
function plugins_url($p = '', $f = '') { return 'https://example.test/wp-content/plugins/image-carousel-pro/' . ltrim($p, '/'); }
function wp_enqueue_style() {}
function wp_enqueue_script() {}
function wp_localize_script() {}
function wp_upload_dir() { return array('basedir' => sys_get_temp_dir(), 'baseurl' => 'https://example.test/uploads'); }
function wp_mkdir_p() { return true; }

require dirname(__DIR__) . '/image-carousel-pro.php';

$classe = new ReflectionClass('ImageCarouselPro');
$plugin = $classe->newInstanceWithoutConstructor();
foreach ($classe->getProperties() as $p) {
    if ($p->isDefault() && !$p->isStatic() && $p->hasDefaultValue()) {
        if (PHP_VERSION_ID < 80100) {
            $p->setAccessible(true);
        }
        $p->setValue($plugin, $p->getDefaultValue());
    }
}

$casi = array(
    'tutte le immagini' => array(),
    'categoria eventi'  => array('category' => 'eventi'),
);
foreach ($casi as $nome => $atts) {
    $html = $plugin->render_shortcode($atts);
    if (!is_string($html) || $html === '') {
        fwrite(STDERR, "FALLITO: shortcode vuoto ($nome)\n");
        exit(1);
    }
    echo "ok  $nome: " . strlen($html) . " caratteri, immagine 1.0 " . (strpos($html, 'uno.jpg') !== false ? 'presente' : 'assente') . "\n";
}
if (strpos($plugin->render_shortcode(array()), 'uno.jpg') === false) {
    fwrite(STDERR, "FALLITO: l'immagine nel formato 1.0 non compare\n");
    exit(1);
}
echo 'PHP ' . PHP_VERSION . ": smoke test superato\n";
