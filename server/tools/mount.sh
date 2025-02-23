#!/bin/sh

# mkfs.ext4 /dev/vdb

SELF_ID=$(curl http://169.254.169.254/v1.json | jq -r '."instance-v2-id"')
BLOCK_ID="eb6d74c7-81da-40d2-843b-bfca057e9ca8"
VULTR_API_KEY="PECVK4F4OROFEE4ZEL4PNZRR2S66HHILMWVA"
curl "https://api.vultr.com/v2/blocks/${BLOCK_ID}/detach" \
  -X POST \
  -H "Authorization: Bearer ${VULTR_API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{
    "live" : true
  }'
curl "https://api.vultr.com/v2/blocks/${BLOCK_ID}/attach" \
  -X POST \
  -H "Authorization: Bearer ${VULTR_API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{ "instance_id" : '"\"${SELF_ID}\""', "live" : true }'

mkdir /mnt/docker_image
mount /dev/vdb /mnt/docker_image
cp /mnt/docker_image/ocr-server.tar /root/ocr-server.tar
docker load --input /root/ocr-server.tar
docker run --gpus all -d --name ocr-server -p 3000:3000 --restart=always ocr-server
