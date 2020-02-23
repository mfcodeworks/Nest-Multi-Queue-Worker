import { RabbitMQModule, RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { WorkerService } from './services/worker.service';
import config from 'config';
const rabbitConf: RabbitMQConfig = config.get('rabbitmq')

@Module({
    imports: [RabbitMQModule.forRoot(RabbitMQModule, rabbitConf)],
    providers: [WorkerService],
    exports: [
        RabbitMQModule,
        WorkerService
    ]
})
export class WorkerModule implements OnApplicationBootstrap {
    onApplicationBootstrap(): void {
        // Log config
        console.log('RabbitMQ Config', rabbitConf);
    }
}
