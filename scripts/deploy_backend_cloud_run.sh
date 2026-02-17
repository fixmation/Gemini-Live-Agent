#!/usr/bin/env bash

# Deploy backend (FastAPI + Gemini agent) to Google Cloud Run.
# This script is provided to PROVE automated cloud deployment for Devpost.
# It is intended as a template; fill in the PROJECT_ID, REGION, and other values
# before running.

set -euo pipefail

PROJECT_ID="YOUR_GCP_PROJECT_ID"
REGION="us-central1"
SERVICE_NAME="ui-navigator-backend"
ARTIFACT_REPO="ui-navigator"
IMAGE_NAME="backend"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${IMAGE_NAME}:latest"

if [[ "$PROJECT_ID" == "YOUR_GCP_PROJECT_ID" ]]; then
  echo "Please edit deploy_backend_cloud_run.sh and set PROJECT_ID before running." >&2
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

gcloud builds submit ./backend \
  --tag "$IMAGE" \
  --project "$PROJECT_ID"

# Deploy to Cloud Run

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --project "$PROJECT_ID" \
  --port 8001 \
  --set-env-vars EMERGENT_LLM_KEY="YOUR_EMERGENT_LLM_KEY_OR_SECRET_REF" \
  --set-env-vars MONGO_URL="YOUR_MONGO_URL_OR_SECRET_REF"

# After deployment, Cloud Run will output the service URL.
# You can then point the frontend's REACT_APP_BACKEND_URL to:
#   https://<cloud-run-url>/api
