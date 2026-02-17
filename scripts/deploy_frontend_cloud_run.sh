#!/usr/bin/env bash

# Deploy frontend (UI Navigator Studio) to Google Cloud Run.
# This script is provided to PROVE automated cloud deployment for Devpost.
# It assumes a Dockerfile exists in ./frontend that builds a static Vite app
# served by a simple HTTP server (e.g., nginx or node).

set -euo pipefail

PROJECT_ID="YOUR_GCP_PROJECT_ID"
REGION="us-central1"
SERVICE_NAME="ui-navigator-frontend"
ARTIFACT_REPO="ui-navigator"
IMAGE_NAME="frontend"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${IMAGE_NAME}:latest"

if [[ "$PROJECT_ID" == "YOUR_GCP_PROJECT_ID" ]]; then
  echo "Please edit deploy_frontend_cloud_run.sh and set PROJECT_ID before running." >&2
  exit 1
fi

# Enable required services (idempotent)

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project "$PROJECT_ID"

# Create Artifact Registry repo if it doesn't exist

gcloud artifacts repositories create "$ARTIFACT_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="UI Navigator images" \
  --project="$PROJECT_ID" || true

# Build and push image using Cloud Build

gcloud builds submit ./frontend \
  --tag "$IMAGE" \
  --project "$PROJECT_ID"

# Deploy to Cloud Run

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --project "$PROJECT_ID" \
  --port 3000

# After deployment, Cloud Run will output the service URL.
# Set REACT_APP_BACKEND_URL on the frontend to point to the backend Cloud Run URL.
