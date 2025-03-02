docker run \
  -d \
  -p 3001:3001 \
  --name ocr-web \
  --mount type=bind,src=/C/Users/shenm/repos/ocr-web/server/.env,dst=/ocr-web/server/.env \
  -i ocr-web:latest
