# Optional Kubernetes deployment

The supported hosted deployment for this repository is **Vercel (frontend) + Render (API)**. These manifests are retained only for teams that intentionally run the project on Kubernetes.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured for it.
- Docker images built from the current `backend/` and `frontend/` directories and pushed to a registry the cluster can access.
- MongoDB and backend credentials supplied as Kubernetes Secrets. Secret values must not be committed to Git.

The image names in `backend-deployment.yaml` and `frontend-deployment.yaml` are legacy placeholders. Replace them with your own published image references before applying the deployments.

## Create the namespace and secrets

```bash
kubectl apply -f namespace.yaml

# Set these in your local shell first; do not put the values in YAML or commit them.
export MONGO_ROOT_USERNAME='placehub'
export MONGO_ROOT_PASSWORD='REPLACE_WITH_A_LONG_URL_SAFE_PASSWORD'
export JWT_SECRET='REPLACE_WITH_A_LONG_RANDOM_SECRET'
export OTP_SECRET='REPLACE_WITH_A_DIFFERENT_LONG_RANDOM_SECRET'
export BOOTSTRAP_ADMIN_PASSWORD='REPLACE_WITH_A_LONG_INITIAL_ADMIN_PASSWORD'
export CLOUDINARY_CLOUD_NAME=''
export CLOUDINARY_API_KEY=''
export CLOUDINARY_API_SECRET=''
export BREVO_API_KEY=''
export BREVO_SENDER_EMAIL=''
export CLIENT_URL='https://your-frontend.example'
export FRONTEND_URL='https://your-frontend.example'
export MONGODB_URL="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongo-0.mongo.cpms.svc.cluster.local:27017/CPMS?authSource=admin"

kubectl create secret generic mongo-secret --namespace cpms \
  --from-literal=mongo-root-username="$MONGO_ROOT_USERNAME" \
  --from-literal=mongo-root-password="$MONGO_ROOT_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic backend-secret --namespace cpms \
  --from-literal=MONGODB_URL="$MONGODB_URL" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=OTP_SECRET="$OTP_SECRET" \
  --from-literal=BOOTSTRAP_ADMIN_PASSWORD="$BOOTSTRAP_ADMIN_PASSWORD" \
  --from-literal=CLOUDINARY_CLOUD_NAME="$CLOUDINARY_CLOUD_NAME" \
  --from-literal=CLOUDINARY_API_KEY="$CLOUDINARY_API_KEY" \
  --from-literal=CLOUDINARY_API_SECRET="$CLOUDINARY_API_SECRET" \
  --from-literal=BREVO_API_KEY="$BREVO_API_KEY" \
  --from-literal=BREVO_SENDER_EMAIL="$BREVO_SENDER_EMAIL" \
  --from-literal=BREVO_SENDER_NAME='PlaceHub' \
  --from-literal=CLIENT_URL="$CLIENT_URL" \
  --from-literal=FRONTEND_URL="$FRONTEND_URL" \
  --dry-run=client -o yaml | kubectl apply -f -
```

The MongoDB password in `MONGODB_URL` must be URL-encoded if it contains reserved URI characters. Keep the shell session private and clear exported secrets when finished.

## Deploy MongoDB and the API

```bash
kubectl apply -f mongo-configmap.yaml -f mongo-statefulset.yaml -f mongo-service.yaml
kubectl apply -f backend-config.yaml -f backend-deployment.yaml -f backend-service.yaml
kubectl get pods -n cpms
kubectl logs -n cpms deployment/backend
```

The API health probes use `GET /health` on container port `4518`. The backend secret is created separately as shown above; there is deliberately no Secret manifest with sample credentials in this repository.

## Deploy the frontend

The frontend image must be built with the API base path `/api`, which the included Nginx config proxies to the `backend` service:

```bash
docker build --build-arg VITE_BACKEND_URL=/api -t YOUR_REGISTRY/placehub-frontend:TAG ./frontend
docker build -t YOUR_REGISTRY/placehub-backend:TAG ./backend
```

Push those images, replace the legacy image references in both Deployment manifests, and then apply:

```bash
kubectl apply -f frontend-deployment.yaml -f frontend-service.yaml
kubectl get svc -n cpms
```

## Troubleshooting

- API readiness: `kubectl describe pod -n cpms -l app=backend`
- API logs: `kubectl logs -n cpms deployment/backend`
- MongoDB access: check `mongo-0.mongo.cpms.svc.cluster.local:27017` and the `MONGODB_URL` Secret value.
- CORS failures: `CLIENT_URL` must exactly match the browser's frontend origin (scheme + host + optional port), with comma-separated values for multiple origins.

```bash
kubectl delete namespace cpms
```
