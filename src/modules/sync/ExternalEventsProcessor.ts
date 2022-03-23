import { ILogger } from "@js-soft/logging-abstractions"
import { CoreId, TransportLoggerFactory } from "../../core"
import { MessageController } from "../messages/MessageController"
import { RelationshipsController } from "../relationships/RelationshipsController"
import { BackboneExternalEvent } from "./backbone/BackboneExternalEvent"
import { FinalizeSyncRunRequestExternalEventResult } from "./backbone/FinalizeSyncRun"
import { ChangedItems } from "./ChangedItems"
import { SyncProgressReporter, SyncProgressReporterStep, SyncStep } from "./SyncCallback"

export class ExternalEventsProcessor {
    private readonly log: ILogger
    public readonly changedItems: ChangedItems = new ChangedItems()
    public readonly results: FinalizeSyncRunRequestExternalEventResult[] = []
    private readonly syncStep: SyncProgressReporterStep | undefined

    public constructor(
        private readonly messagesController: MessageController,
        private readonly relationshipsController: RelationshipsController,
        private readonly externalEvents: BackboneExternalEvent[],
        reporter?: SyncProgressReporter
    ) {
        this.log = TransportLoggerFactory.getLogger(ExternalEventsProcessor)
        this.syncStep = reporter?.createStep(SyncStep.ExternalEventsProcessing, externalEvents.length)
    }

    public async execute(): Promise<void> {
        for (const externalEvent of this.externalEvents) {
            try {
                switch (externalEvent.type) {
                    case "MessageReceived":
                        await this.applyMessageReceivedEvent(externalEvent)
                        break
                    case "MessageDelivered":
                        await this.applyMessageDeliveredEvent(externalEvent)
                        break
                    case "RelationshipChangeCreated":
                        await this.applyRelationshipChangeCreatedEvent(externalEvent)
                        break
                    case "RelationshipChangeCompleted":
                        await this.applyRelationshipChangeCompletedEvent(externalEvent)
                        break
                    default:
                        throw new Error(`'${externalEvent.type}' is not a supported external event type.`)
                }

                this.results.push({
                    externalEventId: externalEvent.id
                })
            } catch (e) {
                this.log.error("There was an error while trying to apply an external event: ", e)

                let errorCode
                if (e.code) {
                    errorCode = e.code
                } else if (e.message) {
                    errorCode = e.message
                } else {
                    errorCode = JSON.stringify(e)
                }

                this.results.push({
                    externalEventId: externalEvent.id,
                    errorCode: errorCode
                })
            } finally {
                this.syncStep?.progress()
            }
        }
    }

    private async applyRelationshipChangeCompletedEvent(externalEvent: BackboneExternalEvent) {
        const payload = externalEvent.payload as { changeId: string }
        const relationship = await this.relationshipsController.applyChangeById(payload.changeId)

        if (relationship) {
            this.changedItems.addRelationship(relationship)
        }
    }

    private async applyRelationshipChangeCreatedEvent(externalEvent: BackboneExternalEvent) {
        const payload = externalEvent.payload as { changeId: string; relationshipId: string }
        const relationship = await this.relationshipsController.applyChangeById(payload.changeId)

        if (relationship) {
            this.changedItems.addRelationship(relationship)
        }
    }

    private async applyMessageDeliveredEvent(externalEvent: BackboneExternalEvent) {
        const messageReceivedPayload = externalEvent.payload as { id: string }
        const updatedMessages = await this.messagesController.updateCache([messageReceivedPayload.id])

        this.changedItems.addMessage(updatedMessages[0])
    }

    private async applyMessageReceivedEvent(externalEvent: BackboneExternalEvent) {
        const newMessagePayload = externalEvent.payload as { id: string }
        const newMessage = await this.messagesController.loadPeerMessage(CoreId.from(newMessagePayload.id))
        this.changedItems.addMessage(newMessage)
    }
}
