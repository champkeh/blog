#!/bin/sh
USER=root
HOST=vultr
DIR=/var/www/champis.me/

hugo && rsync -avz --delete public/ ${USER}@${HOST}:${DIR}

exit 0