import os
import sys
import io
import time
from PIL import Image

print("=" * 60)
print("TEST 1: Testing Real-ESRGAN Core Python API")
print("=" * 60)

from api import RealESRGANService, MODEL_CONFIGS

test_img_path = os.path.join(os.path.dirname(__file__), "inputs", "0014.jpg")
assert os.path.exists(test_img_path), f"Test image not found at {test_img_path}"

with open(test_img_path, "rb") as f:
    img_bytes = f.read()

orig_pil = Image.open(io.BytesIO(img_bytes))
orig_w, orig_h = orig_pil.size
print(f"[OK] Loaded test image: {orig_w}x{orig_h} ({len(img_bytes)} bytes)")

# Test 1a: Fast General Model
print("\n--- Running Test 1a: Model 'realesr-general-x4v3' ---")
t0 = time.time()
res1 = RealESRGANService.restore(img_bytes, model_name='realesr-general-x4v3', outscale=4.0)
t1 = time.time()

print(f"[SUCCESS] Refined & Restored in {res1['elapsed_time']:.2f}s (Total: {t1-t0:.2f}s)")
print(f"[SUCCESS] Input shape: {res1['input_shape']}, Output shape: {res1['output_shape']}")
assert res1['output_shape'] == (orig_w * 4, orig_h * 4), f"Expected {(orig_w*4, orig_h*4)}, got {res1['output_shape']}"
assert res1['elapsed_time'] < 5.0, f"Restoration took too long: {res1['elapsed_time']}s"
print("[TEST 1a PASSED] Speed and resolution requirements satisfied!")

# Test 1b: Ultra-Fast Anime Model
print("\n--- Running Test 1b: Model 'realesr-animevideov3' ---")
t0 = time.time()
res2 = RealESRGANService.restore(img_bytes, model_name='realesr-animevideov3', outscale=4.0)
t1 = time.time()

print(f"[SUCCESS] Refined & Restored in {res2['elapsed_time']:.2f}s (Total: {t1-t0:.2f}s)")
print(f"[SUCCESS] Input shape: {res2['input_shape']}, Output shape: {res2['output_shape']}")
assert res2['output_shape'] == (orig_w * 4, orig_h * 4)
print("[TEST 1b PASSED] Blazing fast anime model satisfied!")

print("\n" + "=" * 60)
print("TEST 2: Testing Flask REST API with Multipart Upload")
print("=" * 60)

from flask_api import app

with app.test_client() as client:
    # 2a: Health check
    resp = client.get('/api/health')
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
    health_data = resp.get_json()
    print(f"[OK] Health check passed: {health_data}")

    # 2b: Models list
    resp = client.get('/api/models')
    assert resp.status_code == 200
    models_data = resp.get_json()
    print(f"[OK] Available models API passed: {list(models_data.keys())}")

    # 2c: Upload picture and restore (JSON response)
    print("\n--- Testing POST /api/restore (JSON format) ---")
    data = {
        'file': (io.BytesIO(img_bytes), '0014.jpg'),
        'model': 'realesr-general-x4v3',
        'outscale': '4.0'
    }
    resp = client.post('/api/restore?format=json', data=data, content_type='multipart/form-data')
    assert resp.status_code == 200, f"Restore failed: {resp.get_data(as_text=True)}"
    json_resp = resp.get_json()
    print(f"[SUCCESS] Upload & restore JSON response: {json_resp}")
    assert json_resp['success'] is True
    assert json_resp['output_shape'] == [orig_w * 4, orig_h * 4]

    # 2d: Upload picture and restore (Direct Image binary stream)
    print("\n--- Testing POST /api/restore (Binary PNG stream) ---")
    data = {
        'file': (io.BytesIO(img_bytes), '0014.jpg'),
        'model': 'realesr-general-x4v3',
        'outscale': '4.0'
    }
    resp = client.post('/api/restore', data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    assert resp.content_type == 'image/png'
    restored_bytes = resp.get_data()
    out_pil = Image.open(io.BytesIO(restored_bytes))
    print(f"[SUCCESS] Received restored PNG: {out_pil.size[0]}x{out_pil.size[1]} ({len(restored_bytes)} bytes)")
    assert out_pil.size == (orig_w * 4, orig_h * 4)

print("\n" + "=" * 60)
print("TEST 3: Verifying Streamlit App Structure & Syntax")
print("=" * 60)
import py_compile
py_compile.compile(os.path.join(os.path.dirname(__file__), "app.py"), doraise=True)
print("[OK] Streamlit app.py compiles cleanly with zero syntax errors!")

print("\n" + "=" * 60)
print("ALL TESTS PASSED SUCCESSFULLY!")
print("=" * 60)
