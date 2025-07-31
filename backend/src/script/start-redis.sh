#!/bin/bash

# Thư mục Redis setup
REDIS_DIR="./redis-docker"
REDIS_CONF="$REDIS_DIR/redis.conf"
DOCKER_COMPOSE="$REDIS_DIR/docker-compose.yml"

# Kiểm tra docker-compose
if ! command -v docker-compose &> /dev/null; then
  echo " docker-compose chưa được cài. Hãy cài đặt trước."
  exit 1
fi

# Tạo thư mục nếu chưa có
mkdir -p "$REDIS_DIR"

# Tạo file redis.conf nếu chưa tồn tại
if [ ! -f "$REDIS_CONF" ]; then
cat <<EOF > "$REDIS_CONF"
bind 0.0.0.0
protected-mode no
appendonly yes
EOF
fi

# Tạo file docker-compose.yml nếu chưa tồn tại
if [ ! -f "$DOCKER_COMPOSE" ]; then
cat <<EOF > "$DOCKER_COMPOSE"
services:
  redis:
    image: redis:7.2-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
EOF
fi

# Chạy Redis
cd "$REDIS_DIR"
docker-compose up -d

echo " Redis đã được khởi động tại localhost:6379"
