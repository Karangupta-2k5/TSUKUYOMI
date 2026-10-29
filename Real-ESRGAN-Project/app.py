import os
import io
import time
import streamlit as st
from PIL import Image
import numpy as np

# Import our restoration API service
from api import RealESRGANService, MODEL_CONFIGS

st.set_page_config(
    page_title="Real-ESRGAN Image Restorer",
    page_icon="✨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        color: #64748b;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px 16px;
        text-align: center;
    }
    .stButton>button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.6rem 1.8rem;
        font-weight: 600;
        font-size: 1.05rem;
        transition: all 0.2s ease-in-out;
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-title">✨ Real-ESRGAN Image Super-Resolution & Restoration</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">Upload a single picture to refine, remove artifacts, and upscale with high speed.</div>', unsafe_allow_html=True)

# Sidebar settings
st.sidebar.header("⚙️ Configuration")

model_options = list(MODEL_CONFIGS.keys())
model_format = lambda k: f"{MODEL_CONFIGS[k]['display_name']} [{MODEL_CONFIGS[k]['speed']}]"

selected_model = st.sidebar.selectbox(
    "Restoration Model",
    options=model_options,
    index=0,
    format_func=model_format,
    help="Ultra Fast (srvgg) runs in ~1s on CPU. Deep Detail (rrdb) offers maximum detail for complex textures."
)

st.sidebar.caption(MODEL_CONFIGS[selected_model]['description'])

outscale = st.sidebar.select_slider(
    "Upsampling Scale Factor",
    options=[2.0, 3.0, 4.0],
    value=4.0,
    help="Scale factor for super-resolution (e.g. 4x turns a 200x200 image into 800x800)."
)

tile_option = st.sidebar.selectbox(
    "Tile Processing (for large images)",
    options=[0, 256, 512],
    index=0,
    format_func=lambda x: "No Tiling (Fastest full-frame)" if x == 0 else f"{x}x{x} Tiles (Lower RAM)",
    help="Use tiling for very large input images to save memory."
)

st.sidebar.markdown("---")
st.sidebar.markdown("🖥️ **Inference Engine:** PyTorch CPU Optimized")
st.sidebar.markdown("🚀 **Default Model:** `realesr-general-x4v3` (Compact VGG)")

# Main upload and interaction section
col_input, col_preset = st.columns([2, 1])

with col_input:
    uploaded_file = st.file_uploader(
        "Upload one picture (PNG, JPG, JPEG, WEBP)",
        type=["png", "jpg", "jpeg", "webp"],
        help="Upload an image to refine and restore."
    )

with col_preset:
    st.markdown("**Or try a sample image:**")
    preset_cols = st.columns(3)
    sample_images = {
        "Sample 1": r"inputs/0014.jpg",
        "Sample 2": r"inputs/0030.jpg",
        "Sample 3": r"inputs/ADE_val_00000114.jpg"
    }

    if 'selected_sample' not in st.session_state:
        st.session_state.selected_sample = None

    for i, (name, path) in enumerate(sample_images.items()):
        full_sample_path = os.path.join(os.path.dirname(__file__), path)
        if os.path.exists(full_sample_path):
            if preset_cols[i].button(name, key=f"btn_{name}"):
                st.session_state.selected_sample = full_sample_path

# Determine which image to load
current_img_bytes = None
img_source_name = ""

if uploaded_file is not None:
    current_img_bytes = uploaded_file.read()
    img_source_name = uploaded_file.name
elif st.session_state.selected_sample is not None and os.path.exists(st.session_state.selected_sample):
    with open(st.session_state.selected_sample, "rb") as f:
        current_img_bytes = f.read()
    img_source_name = os.path.basename(st.session_state.selected_sample)

if current_img_bytes:
    orig_pil = Image.open(io.BytesIO(current_img_bytes))
    orig_w, orig_h = orig_pil.size

    st.markdown("---")
    st.subheader("📷 Input Image Preview")
    
    col_prev, col_info = st.columns([1, 2])
    with col_prev:
        st.image(orig_pil, caption=f"Original: {img_source_name}", use_container_width=True)
    with col_info:
        st.markdown(f"**Original Resolution:** `{orig_w} × {orig_h}` pixels")
        st.markdown(f"**Megapixels:** `{(orig_w * orig_h) / 1e6:.2f} MP`")
        st.markdown(f"**Selected Target Model:** `{selected_model}`")
        st.markdown(f"**Target Upscale:** `{outscale}x` (Target: `{int(orig_w * outscale)} × {int(orig_h * outscale)}`)")

        start_restore = st.button("🚀 Restore & Refine Image Now", use_container_width=True)

    if start_restore:
        with st.spinner("Refining image with Real-ESRGAN..."):
            t_start = time.time()
            try:
                res = RealESRGANService.restore(
                    image_input=current_img_bytes,
                    model_name=selected_model,
                    outscale=outscale,
                    tile=tile_option
                )
                output_pil = res['output_pil']
                elapsed = res['elapsed_time']
                out_w, out_h = res['output_shape']

                st.success(f"✨ Successfully restored and refined in {elapsed:.2f} seconds!")

                # Key Metrics Cards
                m1, m2, m3, m4 = st.columns(4)
                m1.metric("Processing Time", f"{elapsed:.2f} s")
                m2.metric("Original Size", f"{orig_w}×{orig_h}")
                m3.metric("Restored Size", f"{out_w}×{out_h}")
                m4.metric("Resolution Boost", f"{outscale}x")

                # Before & After Visualizer
                st.markdown("### 🔍 Before & After Comparison")
                tab1, tab2 = st.tabs(["Side-by-Side Comparison", "Full Restored Image"])

                with tab1:
                    c1, c2 = st.columns(2)
                    with c1:
                        st.markdown("**Original Low-Res Image**")
                        st.image(orig_pil, use_container_width=True)
                    with c2:
                        st.markdown("**Refined & Restored (Super-Resolution)**")
                        st.image(output_pil, use_container_width=True)

                with tab2:
                    st.image(output_pil, caption="Restored Output", use_container_width=True)

                # Download Button
                buf = io.BytesIO()
                output_pil.save(buf, format="PNG")
                byte_im = buf.getvalue()

                out_filename = f"restored_{outscale}x_{img_source_name}.png"
                st.download_button(
                    label="📥 Download Restored Image (PNG)",
                    data=byte_im,
                    file_name=out_filename,
                    mime="image/png",
                    use_container_width=True
                )

            except Exception as e:
                st.error(f"Error during restoration: {str(e)}")
else:
    st.info("👆 Please upload an image or choose one of the sample presets to begin.")
