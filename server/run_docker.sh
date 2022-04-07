docker build -t metrics_api .
docker run --env-file .env.local metrics_api 