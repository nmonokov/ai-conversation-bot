#!/bin/bash

# Set default region
DEFAULT_REGION="eu-central-1"
REGION=${1:-$DEFAULT_REGION}

# Create folder to store ffmpeg
mkdir layer
cd layer

# Check if ffmpeg folder already exists
if [ ! -d ffmpeg ]; then
    # Download and unpack ffmpeg lib
    curl -O https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz
    tar xf ffmpeg-git-amd64-static.tar.xz
    rm ffmpeg-git-amd64-static.tar.xz
    mv ffmpeg-git-*-amd64-static ffmpeg
else
    echo "ffmpeg folder already exists. Skipping download."
fi
cd ..

# Deploy lambda layer to AWS account. Should be executed once since several deployments will create
# several versions of Lambda Layer
npx serverless deploy --config serveless-layer.yml --region ${REGION}