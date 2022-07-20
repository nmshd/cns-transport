import { Message } from "../modules/messages/local/Message"
import { TransportDataEvent } from "./TransportDataEvent"

export class MessageReceivedEvent extends TransportDataEvent<Message> {
    public static readonly namespace = "transport.messageReceived"

    public constructor(eventTargetAddress: string, data: Message) {
        super(MessageReceivedEvent.namespace, eventTargetAddress, data)
    }
}
