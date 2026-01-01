from http.server import BaseHTTPRequestHandler
import json
import tempfile
import os
import gzip
from io import BytesIO
import cgi

class handler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        # CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            # CORS headers
            self.send_header('Access-Control-Allow-Origin', '*')
            
            # Парсинг multipart/form-data
            content_type = self.headers['content-type']
            if not content_type:
                self.send_error(400, "Missing content-type header")
                return
                
            # Отримати boundary для парсингу форми
            content_length = int(self.headers['Content-Length'])
            
            # Читаємо дані
            post_data = self.rfile.read(content_length)
            
            # Парсинг form data
            boundary = content_type.split("boundary=")[1].encode()
            parts = post_data.split(b'--' + boundary)
            
            svg_content = None
            animation_type = 'fade'
            
            for part in parts:
                if b'filename=' in part and b'.svg' in part:
                    # Знайшли SVG файл
                    svg_start = part.find(b'') + 4
                    svg_end = part.rfind(b'')
                    svg_content = part[svg_start:svg_end]
                elif b'name="animation"' in part:
                    # Знайшли тип анімації
                    anim_start = part.find(b'') + 4
                    anim_end = part.rfind(b'')
                    animation_type = part[anim_start:anim_end].decode('utf-8')
            
            if not svg_content:
                self.send_error(400, "No SVG file found")
                return
            
            # Створення тимчасових файлів
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.svg', delete=False) as svg_file:
                svg_file.write(svg_content)
                svg_path = svg_file.name
            
            lottie_path = svg_path.replace('.svg', '.json')
            tgs_path = svg_path.replace('.svg', '.tgs')
            
            try:
                # Імпорт lottie після створення файлів
                from lottie import objects as lottie_objects
                from lottie.importers.svg import import_svg
                from lottie.exporters.tgs import export_tgs
                from lottie import Point
                
                # Імпорт SVG
                animation = import_svg(svg_path)
                
                # Налаштування для Telegram
                animation.frame_rate = 60
                animation.out_point = 180  # 3 секунди * 60 fps
                
                # Масштабування до 512x512
                animation.width = 512
                animation.height = 512
                
                # Додавання простої анімації
                if animation_type == 'fade':
                    # Fade in/out анімація
                    for layer in animation.layers:
                        if hasattr(layer, 'transform'):
                            layer.transform.opacity.add_keyframe(0, 0)
                            layer.transform.opacity.add_keyframe(30, 100)
                            layer.transform.opacity.add_keyframe(150, 100)
                            layer.transform.opacity.add_keyframe(180, 0)
                
                elif animation_type == 'rotate':
                    # Rotation анімація
                    for layer in animation.layers:
                        if hasattr(layer, 'transform'):
                            layer.transform.rotation.add_keyframe(0, 0)
                            layer.transform.rotation.add_keyframe(180, 360)
                
                elif animation_type == 'scale':
                    # Scale анімація
                    for layer in animation.layers:
                        if hasattr(layer, 'transform'):
                            layer.transform.scale.add_keyframe(0, Point(80, 80))
                            layer.transform.scale.add_keyframe(90, Point(120, 120))
                            layer.transform.scale.add_keyframe(180, Point(80, 80))
                
                # Експорт в TGS
                export_tgs(animation, tgs_path)
                
                # Читання TGS файлу
                with open(tgs_path, 'rb') as f:
                    tgs_data = f.read()
                
                # Відправка відповіді
                self.send_response(200)
                self.send_header('Content-Type', 'application/gzip')
                self.send_header('Content-Disposition', 'attachment; filename="sticker.tgs"')
                self.send_header('Content-Length', str(len(tgs_data)))
                self.end_headers()
                self.wfile.write(tgs_data)
                
            finally:
                # Видалення тимчасових файлів
                for path in [svg_path, lottie_path, tgs_path]:
                    if os.path.exists(path):
                        os.unlink(path)
                        
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = {
                'error': str(e),
                'message': 'Conversion failed'
            }
            self.wfile.write(json.dumps(error_response).encode())
