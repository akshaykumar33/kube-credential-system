#!/bin/sh

echo "window._env_ = {" > /usr/share/nginx/html/config.js
echo "  API_BASE_URL: \"$API_BASE_URL\"," >> /usr/share/nginx/html/config.js
echo "};" >> /usr/share/nginx/html/config.js

exec "$@"
