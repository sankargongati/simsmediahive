⚠️ **THIS REPO IS FOR R&D ONLY AND WILL NOT BE DEPLOYED - FOR DEPLOYMENT, FURTHER CONVERSATION IS NEEDED** ⚠️

<div align="center">
<h1>Multi and Single Player Kinematics</h1>
</div>

This repository processes NCAA basketball videos to compute player kinematics using SAMURAI for player tracking and homography for court coordinate transformation. The system supports both single-player tracking (with bounding box input) and multi-player tracking (with automatic jersey detection). Moreover, using time-series analysis from the kinematic data we are able to do player action recognition.

### Single Player Mode
 Provide a bounding box of the desired player to track their acceleration/speed throughout the clip.
![teaser](data/teaser.png)

### Multi Player Mode: 
Automatically detect and track multiple players using jersey detection, whilst computing kinematics for all detected players.

![multi-player-teaser](data/multi-player-teaser.png)

## Setup
### SAMURAI Installation 

SAM 2 needs to be installed first before use. The code requires `python>=3.10`, as well as `torch>=2.3.1` and `torchvision>=0.18.1`. Please follow the instructions [here](https://github.com/facebookresearch/sam2?tab=readme-ov-file) to install both PyTorch and TorchVision dependencies. You can install **the SAMURAI version** of SAM 2 on a GPU machine using:
```
cd sam2
pip install -e .
pip install -e ".[notebooks]"
```

Please see [INSTALL.md](https://github.com/facebookresearch/sam2/blob/main/INSTALL.md) from the original SAM 2 repository for FAQs on potential issues and solutions.

Install other requirements:
```
pip install matplotlib==3.7 tikzplotlib jpeg4py opencv-python lmdb pandas scipy loguru
```

### SAM 2.1 Checkpoint Download

```
cd checkpoints && \
./download_ckpts.sh && \
cd ..
```

## Model Checkpoints

To obtain the checkpoints we should download them from GCP as
```
mkdir checkpoints
gsutil -m cp -r gs:/inv-charlotte-hornets-bucket/kinematics-models/* checkpoints
```
This will download the jersey, homography, player-detection models. 

## Dataset

### Dowloading videos
To download from GCP
```
mkdir videos
gsutil -m cp -r gs://inv-charlotte-hornets-bucket/single-shots/* videos
```

### Converting the videos
Just copy this bash script and ran it on the terminal
```
mkdir -p frames

for vid in videos/*.mp4; do
  # 1) Strip off path + extension to get a "basename"
  filename=$(basename "$vid")            # e.g. "myvideo1.mp4"
  name="${filename%.*}"                  # e.g. "myvideo1"

  # 2) Make an output directory for this video
  mkdir -p "frames/$name"

  # 3) Run FFmpeg:
  #    -i "$vid"           → input file
  #    -vf fps=30          → extract at 30 frames per second
  #    -q:v 2              → JPEG quality (2 is visually lossless; 1 is "best" but huge)
  #    "frames/$name/%06d.jpg" → output pattern: 000001.jpg, 000002.jpg, …
  ffmpeg -i "$vid" -vf fps=30 -q:v 2 "frames/$name/%06d.jpg"
done
```

## Single Player Mode Kinematics
To define which player to track we have the following pipeline

```
# 1. On server: Create download package
python annotate.py --download frames/

# 2. Download to local machine (run on LOCAL terminal)
scp INSTANCE:/home/jupyter/samurai/annotation_package.zip ./

# 3. Extract locally and annotate
unzip annotation_package.zip annotation_package/
python annotation_package/annotate.py --annotate player_bailey ./bailey_long

# 4. Collect annotations
python annotation_package/annotate.py --collect ./

# 5. Upload back to server
scp annotations.zip INSTANCE:/home/jupyter/samurai/

# 6. On server: Extract and convert
unzip annotations.zip frames/annotations
python src/utils/csv_to_json.py --input-dir frames/annotations --output frames/annotations/bounding_boxes2.json
```

## Inference
To see the pipeline's option we can do
```
python src/main.py --help
```

For good baseline options we have the following:

**Single Player Mode** 
```
python src/main.py --bboxes single-shots/annotations/integrated_bounding_boxes.json --skip-optical-flow --kalman-accel-std 0.05 --kalman-meas-std 0.02 --kalman-filter-type cv --mask-center-strategy shape_kalman --player-filter deaaron --use-emea-smoothing --emea-alpha 0.95 --shape-measurement-noise 0.001 --shape-process-noise 0.001 --shape-blend 0.3 --y-axis-smoothing 0.0 
```

**Multi Player Mode** :
```
python src/main.py --video-folder single-shots --skip-optical-flow --kalman-accel-std 0.05 --kalman-meas-std 0.02 --kalman-filter-type cv --mask-center-strategy shape_kalman --player-filter deaaron --use-emea-smoothing --emea-alpha 0.95 --shape-measurement-noise 0.001 --shape-process-noise 0.001 --shape-blend 0.3 --y-axis-smoothing 0.0 --multi-player 
```

**Multi Player Mode** (with jersey detection):
```
python src/main.py --video-folder single-shots --skip-optical-flow --kalman-accel-std 0.05 --kalman-meas-std 0.02 --kalman-filter-type cv --mask-center-strategy shape_kalman --player-filter deaaron --use-emea-smoothing --emea-alpha 0.95 --shape-measurement-noise 0.001 --shape-process-noise 0.001 --shape-blend 0.3 --y-axis-smoothing 0.0 --multi-player --enable-jersey-detection --jersey-confidence 0.8 
```

### Parallel Inference
Parallel inference is supported, either with multiple gpus or just a big one. This accelerates the pipeline by fitting more than one instance of the models in the gpu at a time, and processing parallely. 
Simply run `--parallel_num_workers 4` as a parameter in terminal when running the pipeline, or by changing the value in `src/config.py`. 
When using one A100, in general `3` or `4` is the correct value of parallel workers.
