## SafeQR | Admin Dashboard

This dashboard is for administrators of SafeQR. It provides tools to manage users, review QR scans & reports, curate the verified links dataset used for training, and control ML model retraining/publishing.
This dashboard is hosted live on: https://fyp-safeqradmin.vercel.app/

Features
1) User management
2) QR scan management
3) Report management
4) Verified links management (training dataset)
5) Model management

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Model lifecycle (retrain / publish / rollout)
Create version row
Insert into ml_models with model_id (UUID) & version (e.g., 1.2.0).

Retrain
Webhook will automatically call Retrain Cloud Run Function API.
Service fetches url_features, runs GridSearch, exports ONNX → uploads to storage/models/{model_id}.onnx.
Updates ml_models.storage_path, metrics (accuracy, precision, recall, f1, train_time_seconds).

Publish
Admin marks the selected row active=true (and sets others to false) or updates a singleton settings row with the current model_id.

Client usage
Prediction API called by client application will automatically fetch active model for predictions
