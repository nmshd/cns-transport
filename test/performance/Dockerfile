FROM node:15.5.1

COPY . .

ENTRYPOINT npx mocha -r ts-node/register -r tsconfig-paths/register ./test/performance.ts --project ./test/tsconfig.json --exit
