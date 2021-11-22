import { LokiJsConnection } from "@js-soft/docdb-access-loki"
import { WebLoggerFactory } from "@js-soft/web-logger"
import { Test } from "./Test"

const loggerFactory = new WebLoggerFactory()

Test.runUnitTests(loggerFactory)
Test.runIntegrationTests(Test.config, new LokiJsConnection("./db"), loggerFactory)
