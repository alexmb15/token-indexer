#!/usr/bin/env bash
set -e

mongosh --quiet --eval "
  db = db.getSiblingDB('${MONGO_APP_DB}');
  db.createUser({
      user: '${MONGO_APP_USER}',
      pwd:  '${MONGO_APP_PASSWORD}',
      roles: [{ role: 'readWrite', db: '${MONGO_APP_DB}' }]
  });
"
echo '✓ application user created'
