import io
from flask import Flask, request, jsonify, send_file
from api import RealESRGANService, MODEL_CONFIGS

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'models_available': list(MODEL_CONFIGS.keys()),
        'default_model': 'realesr-general-x4v3'
    })

@app.route('/api/models', methods=['GET'])
def list_models():
    return jsonify(MODEL_CONFIGS)

@app.route('/api/restore', methods=['POST'])
def restore_endpoint():
    """Endpoint for uploading one picture and restoring it.
    Expects multipart/form-data with:
        file: image file
        model: (optional) model name, defaults to 'realesr-general-x4v3'
        outscale: (optional) float scale factor, defaults to 4.0
        tile: (optional) int tile size, defaults to 0
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request. Please upload an image using field "file".'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected.'}), 400

    model_name = request.form.get('model', 'realesr-general-x4v3')
    outscale = float(request.form.get('outscale', 4.0))
    tile = int(request.form.get('tile', 0))

    try:
        img_bytes = file.read()
        result = RealESRGANService.restore(
            image_input=img_bytes,
            model_name=model_name,
            outscale=outscale,
            tile=tile
        )

        # Check if caller requested binary image directly
        accept_header = request.headers.get('Accept', '')
        if 'application/json' not in accept_header and request.args.get('format') != 'json':
            buf = io.BytesIO()
            result['output_pil'].save(buf, format='PNG')
            buf.seek(0)
            return send_file(buf, mimetype='image/png', as_attachment=False)

        # Or JSON metadata
        return jsonify({
            'success': True,
            'model_used': result['model_name'],
            'elapsed_time_seconds': round(result['elapsed_time'], 3),
            'input_shape': result['input_shape'],
            'output_shape': result['output_shape'],
            'outscale': result['outscale']
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("Starting Real-ESRGAN REST API server on http://127.0.0.1:5000 ...")
    app.run(host='127.0.0.1', port=5000, debug=False)
