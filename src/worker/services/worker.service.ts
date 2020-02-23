import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RabbitSubscribe, AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class WorkerService implements OnApplicationBootstrap {
    private _messageRetry: Map<string, number> = new Map();

    constructor(private queue: AmqpConnection) {}

    onApplicationBootstrap(): void {
        // Wait for channel connection
        this.queue.managedChannel.on('connect', () => {
            // Send testing message
            setInterval(() => this.queue.publish(
                '',
                'test:first', {
                    uuid: new Date().getTime(),
                    data: 'test payload',
                    datetime: new Date().toUTCString()
                }
            ), 4000);
        });
    }

    // Subscribe to first queue on default exchange
    @RabbitSubscribe({
        exchange: 'amq.direct',
        routingKey: 'test:first',
        queue: 'test:first'
    })
    public async handleTestFirst(data: {}): Promise<void> {
        // Log response
        console.log('Received test:first message', data);

        // Forward payload to second queue
        this.queue.publish(
            '',
            'test:second',
            data, {
                noAck: false
            }
        );
    }

    // Subscribe to second queue on default exchange
    @RabbitSubscribe({
        exchange: 'amq.direct',
        routingKey: 'test:second',
        queue: 'test:second'
    })
    public async handleTestSecond(data: any): Promise<void | Nack> {
        // Log response
        console.log('Received test:second message', data);

        if (!this._messageRetry.has(data.uuid)) {
            this._messageRetry.set(data.uuid, 0);
        }

        // Retry until 3 retries done
        if (this._messageRetry.get(data.uuid) < 3) {
            this._messageRetry.set(data.uuid, this._messageRetry.get(data.uuid) + 1);
            return new Nack(true);
        }
        return new Nack();
    }
}
