import os
import time
import io
import cv2
import numpy as np
import torch
from PIL import Image
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
from realesrgan.archs.srvgg_arch import SRVGGNetCompact

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_DIR = os.path.join(BASE_DIR, 'weights')

# Available model configurations
MODEL_CONFIGS = {
    'realesr-general-x4v3': {
        'name': 'realesr-general-x4v3',
        'display_name': 'Ultra Fast (General Photos & Art) - Recommended',
        'scale': 4,
        'arch': 'srvgg',
        'num_conv': 32,
        'file': 'realesr-general-x4v3.pth',
        'speed': 'Fast (~1-2s)',
        'description': 'Lightweight VGG-Compact network optimized for fast general image restoration and super-resolution.'
    },
    'realesr-animevideov3': {
        'name': 'realesr-animevideov3',
        'display_name': 'Blazing Fast (Anime / Graphics / Icons)',
        'scale': 4,
        'arch': 'srvgg',
        'num_conv': 16,
        'file': 'realesr-animevideov3.pth',
        'speed': 'Ultra Fast (~0.5-1s)',
        'description': 'Compact 16-layer model tuned for anime, illustrations, and line art.'
    },
    'RealESRGAN_x4plus': {
        'name': 'RealESRGAN_x4plus',
        'display_name': 'Deep Detail (RRDBNet 23-Block Heavy)',
        'scale': 4,
        'arch': 'rrdb',
        'file': 'RealESRGAN_x4plus.pth',
        'speed': 'High Detail (Slower on CPU)',
        'description': '23-block Residual-in-Residual Dense Network for maximum texture detail.'
    }
}


class RealESRGANService:
    """Singleton-style service that caches and manages RealESRGAN models."""
    _instances = {}

    @classmethod
    def get_upsampler(cls, model_name='realesr-general-x4v3', tile=0, tile_pad=10, pre_pad=0):
        if model_name not in MODEL_CONFIGS:
            model_name = 'realesr-general-x4v3'

        cache_key = (model_name, tile, tile_pad, pre_pad)
        if cache_key in cls._instances:
            return cls._instances[cache_key]

        cfg = MODEL_CONFIGS[model_name]
        weight_path = os.path.join(WEIGHTS_DIR, cfg['file'])
        if not os.path.isfile(weight_path):
            raise FileNotFoundError(f"Model weight file not found at: {weight_path}")

        device = 'cuda' if torch.cuda.is_available() else 'cpu'

        if cfg['arch'] == 'srvgg':
            model = SRVGGNetCompact(
                num_in_ch=3,
                num_out_ch=3,
                num_feat=64,
                num_conv=cfg['num_conv'],
                upscale=4,
                act_type='prelu'
            )
            netscale = 4
        elif cfg['arch'] == 'rrdb':
            model = RRDBNet(
                num_in_ch=3,
                num_out_ch=3,
                num_feat=64,
                num_block=23,
                num_grow_ch=32,
                scale=4
            )
            netscale = 4
        else:
            raise ValueError(f"Unknown architecture: {cfg['arch']}")

        upsampler = RealESRGANer(
            scale=netscale,
            model_path=weight_path,
            model=model,
            tile=tile,
            tile_pad=tile_pad,
            pre_pad=pre_pad,
            half=False,
            device=device
        )

        cls._instances[cache_key] = upsampler
        return upsampler

    @classmethod
    def restore(cls, image_input, model_name='realesr-general-x4v3', outscale=4.0, tile=0):
        """Refines and restores an image input.

        Args:
            image_input: File path (str), numpy array (BGR/RGB), PIL Image, or bytes.
            model_name: Model identifier in MODEL_CONFIGS.
            outscale: Output scaling factor (e.g. 2, 4).
            tile: Tile size (0 for no tiling; e.g. 256 for lower RAM).

        Returns:
            dict containing:
                - 'output_bgr': Restored image as numpy BGR array
                - 'output_rgb': Restored image as numpy RGB array
                - 'output_pil': Restored image as PIL Image
                - 'elapsed_time': Execution time in seconds
                - 'input_shape': (width, height)
                - 'output_shape': (width, height)
                - 'model_name': Name of model used
        """
        # Convert input to cv2 BGR image
        if isinstance(image_input, str):
            if not os.path.isfile(image_input):
                raise FileNotFoundError(f"Input file not found: {image_input}")
            img = cv2.imread(image_input, cv2.IMREAD_UNCHANGED)
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        elif isinstance(image_input, Image.Image):
            rgb_arr = np.array(image_input)
            if rgb_arr.ndim == 2:
                img = cv2.cvtColor(rgb_arr, cv2.COLOR_GRAY2BGR)
            elif rgb_arr.shape[2] == 4:
                img = cv2.cvtColor(rgb_arr, cv2.COLOR_RGBA2BGRA)
            else:
                img = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
        elif isinstance(image_input, np.ndarray):
            img = image_input.copy()
        else:
            raise TypeError(f"Unsupported image input type: {type(image_input)}")

        if img is None:
            raise ValueError("Failed to decode input image.")

        in_h, in_w = img.shape[:2]
        upsampler = cls.get_upsampler(model_name=model_name, tile=tile)

        start_time = time.time()
        output, _ = upsampler.enhance(img, outscale=float(outscale))
        elapsed = time.time() - start_time

        out_h, out_w = output.shape[:2]

        # Prepare outputs in common formats
        if len(output.shape) == 3 and output.shape[2] == 4:
            output_rgb = cv2.cvtColor(output, cv2.COLOR_BGRA2RGBA)
            pil_mode = 'RGBA'
        elif len(output.shape) == 3 and output.shape[2] == 3:
            output_rgb = cv2.cvtColor(output, cv2.COLOR_BGR2RGB)
            pil_mode = 'RGB'
        else:
            output_rgb = output
            pil_mode = 'L'

        output_pil = Image.fromarray(output_rgb)

        return {
            'output_bgr': output,
            'output_rgb': output_rgb,
            'output_pil': output_pil,
            'elapsed_time': elapsed,
            'input_shape': (in_w, in_h),
            'output_shape': (out_w, out_h),
            'model_name': model_name,
            'outscale': outscale
        }
