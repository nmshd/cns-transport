import { IDatabaseConnection } from "@js-soft/docdb-access-abstractions"
import { ILoggerFactory } from "@js-soft/logging-abstractions"
import { IConfigOverwrite } from "@nmshd/transport"
import { AuthenticationTest, PaginatorTest, RESTClientTest } from "./core/backbone"
import { End2EndTest } from "./end2end"
import {
    AccountControllerTest,
    AttachmentTest,
    CertificateIssuerTest,
    ChallengesTest,
    DeviceOnboardingTest,
    FileControllerTest,
    FileReferenceTest,
    FileSyncTest,
    ListRelationshipMessagesTest,
    MessageContentTest,
    MessageControllerTest,
    MessageSyncTest,
    PublicAPITest,
    RejectAcceptTest,
    RelationshipsControllerTest,
    RelationshipsCustomContentTest,
    RelationshipSyncTest,
    RelationshipTemplateControllerTest,
    SecretControllerTest,
    SyncControllerCallbackTest,
    SyncControllerTest,
    TimeSyncTest,
    TokenContentTest,
    TokenControllerTest,
    TokenReferenceTest,
    TokenSyncTest
} from "./modules"
import { CryptoTest, DateTest, IdentityGeneratorTest, PasswordGeneratorTest, RandomTest, ReflectionTest } from "./utils"

export * from "./end2end"
export * from "./utils"

export enum BackboneEnvironment {
    Local = "http://enmeshed.local",
    Dev = "http://dev.enmeshed.eu", // !!leave http here!!
    Stage = "https://stage.enmeshed.eu",
    Prod = "https://prod.enmeshed.eu"
}

export class Test {
    public static readonly currentEnvironment = BackboneEnvironment.Stage
    public static readonly config: IConfigOverwrite = {
        baseUrl: Test.currentEnvironment,
        debug: true,
        platformClientId: "test",
        platformClientSecret: "a6owPRo8c98Ue8Z6mHoNgg5viF5teD"
    }

    public static runUnitTests(loggerFactory: ILoggerFactory): void {
        new ReflectionTest(loggerFactory).run()
        new PasswordGeneratorTest(loggerFactory).run()
        new RandomTest(loggerFactory).run()
        new CryptoTest(loggerFactory).run()
        new DateTest(loggerFactory).run()
        new IdentityGeneratorTest(loggerFactory).run()
    }

    public static runIntegrationTests(
        config: IConfigOverwrite,
        databaseConnection: IDatabaseConnection,
        loggerFactory: ILoggerFactory
    ): void {
        new AccountControllerTest(config, databaseConnection, loggerFactory).run()
        new MessageSyncTest(config, databaseConnection, loggerFactory).run()
        new TokenSyncTest(config, databaseConnection, loggerFactory).run()
        new FileSyncTest(config, databaseConnection, loggerFactory).run()
        new RelationshipSyncTest(config, databaseConnection, loggerFactory).run()
        new SyncControllerTest(config, databaseConnection, loggerFactory).run()
        new SyncControllerCallbackTest(config, databaseConnection, loggerFactory).run()
        new MessageContentTest(config, databaseConnection, loggerFactory).run()
        new TimeSyncTest(config, databaseConnection, loggerFactory).run()
        new DeviceOnboardingTest(config, databaseConnection, loggerFactory).run()
        new RelationshipsCustomContentTest(config, databaseConnection, loggerFactory).run()
        new FileReferenceTest(config, databaseConnection, loggerFactory).run()
        new TokenContentTest(config, databaseConnection, loggerFactory).run()
        new TokenReferenceTest(config, databaseConnection, loggerFactory).run()
        new RelationshipsControllerTest(config, databaseConnection, loggerFactory).run()
        new RelationshipTemplateControllerTest(config, databaseConnection, loggerFactory).run()
        new MessageControllerTest(config, databaseConnection, loggerFactory).run()
        new FileControllerTest(config, databaseConnection, loggerFactory).run()
        new TokenControllerTest(config, databaseConnection, loggerFactory).run()
        new PublicAPITest(config, databaseConnection, loggerFactory).run()
        new AttachmentTest(config, databaseConnection, loggerFactory).run()
        new End2EndTest(config, databaseConnection, loggerFactory).run()
        new AuthenticationTest(config, databaseConnection, loggerFactory).run()
        new SecretControllerTest(config, databaseConnection, loggerFactory).run()
        new ChallengesTest(config, databaseConnection, loggerFactory).run()
        new CertificateIssuerTest(config, databaseConnection, loggerFactory).run()
        new ListRelationshipMessagesTest(config, databaseConnection, loggerFactory).run()
        new RejectAcceptTest(config, databaseConnection, loggerFactory).run()
        new PaginatorTest(config, databaseConnection, loggerFactory).run()
        new RESTClientTest(config, databaseConnection, loggerFactory).run()
    }
}
