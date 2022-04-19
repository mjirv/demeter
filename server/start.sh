#!/bin/sh

ssh-keygen -b 4096 -f ~/.ssh/id_rsa -q -N ''
cat ~/.ssh/id_rsa.pub
node dist/index.js