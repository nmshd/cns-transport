import { runOnLokiJs, runOnMongoDb, runUnitTests } from "./nodeEnvironments"

runUnitTests()
runOnMongoDb()
runOnLokiJs()
