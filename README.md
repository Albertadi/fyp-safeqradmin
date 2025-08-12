## SafeQR | Admin Dashboard

This dashboard is for administrators of SafeQR. It provides tools to manage users, review QR scans & reports, curate the verified links dataset used for training, and control ML model retraining/publishing.

Features
1) User management
Search, filter, and view public.users (+ reference to auth.users).

Create/update/suspend users (role: end_user / admin).

View login status & last activity (from audit fields if present).

2) QR scan management
Paginated list of qr_scans (decoded content, status, timestamp, user).

Filters: date range, status (Safe, Suspicious, Malicious), user.

Drill-down: raw payload, checks (GSB, ML), and any preview logs.

3) Report management
Triage reports submitted by users.

Set disposition: Pending → Actioned / Dismissed.

One-click: promote to Verified Links to seed training data.

4) Verified links management (training dataset)
CRUD on verified_links (url, security_status: Safe / Malicious).

On insert: Supabase Edge Function triggers Feature Extractor (Cloud Run) to populate url_features.

5) Model management
List ml_models (model_id, version, storage_path, metrics).

Retrain: Post to Cloud Run retraining service with { model_id }.

Publish: mark a specific row as active=true (or update a current_model flag), notify clients to update cached model.

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
