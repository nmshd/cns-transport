# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.194.0/containers/typescript-node/.devcontainer/base.Dockerfile

ARG NODE_VERSION="16-buster"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${NODE_VERSION}

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

RUN npm install -g prettier
RUN npm install -g eslint
RUN npm install -g mocha
RUN npm install -g madge
RUN npm install -g ts-node
RUN npm install -g typescript
