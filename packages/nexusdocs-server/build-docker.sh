#!/bin/bash

set -e

regex='refs/tags/v(.*)'

echo "# docker build script for cube server"

# get timestamp when building starts
DEFAULT_BUILD_TIME=$(date +%s)
BUILD_TIME=${BUILD_TIME-$DEFAULT_BUILD_TIME}
BUILD_TRIGGER=${BUILD_TRIGGER-manual}

if [[ "$GITHUB_ACTIONS" == true ]]; then
  BUILD_TRIGGER=github_actions
fi

GIT_REF=${GITHUB_REF-$(git symbolic-ref HEAD)}
GIT_HASH=${GITHUB_HASH-$(git rev-parse HEAD)}

# VERSION is for docker image tag
VERSION=${VERSION-latest}
if [[ $GITHUB_REF == refs/tags/v* ]]; then
  [[ $GITHUB_REF =~ $regex ]]
  VERSION=${BASH_REMATCH[1]}
fi
# PACKAGE_VERSION is for npm package version
PACKAGE_VERSION=${PACKAGE_VERSION-$(grep '"version"' package.json | cut -d '"' -f 4)}

IMAGE_REGISTRY=${IMAGE_REGISTRY-docker.io}
IMAGE_REPO=${IMAGE_REPO-nexushubs/nexusdocs}
IMAGE_TAG=${IMAGE_REGISTRY}/${IMAGE_REPO}:${VERSION}

echo "--- building args ---"
echo "BUILD_TIME=${BUILD_TIME}"
echo "BUILD_TRIGGER=${BUILD_TRIGGER}"
echo "GIT_REF=${GIT_REF}"
echo "GIT_HASH=${GIT_HASH}"
echo "VERSION=${VERSION}"
export VERSION
echo "PACKAGE_VERSION=${PACKAGE_VERSION}"
export PACKAGE_VERSION
echo "IMAGE_REPO=${IMAGE_REPO}"
export IMAGE_REPO
echo "IMAGE_TAG=${IMAGE_TAG}"
export IMAGE_TAG

echo "# building docker image ..."
docker build \
  --build-arg BUILD_TIME=${BUILD_TIME} \
  --build-arg BUILD_TRIGGER=${BUILD_TRIGGER} \
  --build-arg GIT_REF=${GIT_REF} \
  --build-arg GIT_HASH=${GIT_HASH} \
  --build-arg VERSION=${VERSION} \
  --build-arg PACKAGE_VERSION=${PACKAGE_VERSION} \
  --tag $IMAGE_TAG .

if [[ $1 == '--push' ]]; then
  echo "# pushing image to docker registry ..."
  docker login --username=$DOCKER_USERNAME --password=$DOCKER_TOKEN $IMAGE_REGISTRY
  docker push $IMAGE_TAG
fi
