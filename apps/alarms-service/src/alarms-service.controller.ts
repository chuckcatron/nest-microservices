import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { NOTIFICATIONS_SERVICE } from './constants';
import { lastValueFrom } from 'rxjs';
import { TracingLogger } from '@app/tracing/tracing.logger';
import { NatsClientProxy } from '@app/tracing/nats-client/nats-client.proxy';

@Controller()
export class AlarmsServiceController {
  //private readonly logger = new Logger(AlarmsServiceController.name);
  constructor(
    private readonly natsMessageBroker: NatsClientProxy,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsService: ClientProxy,
    private readonly logger: TracingLogger,
  ) {}

  @EventPattern('alarm.created')
  async create(@Payload() data: { name: string; buildingId: number }) {
    this.logger.debug(
      `Received new "alarm.created" event: ${JSON.stringify(data)}`,
    );

    const alarmClassification = await lastValueFrom(
      this.natsMessageBroker.send('alarm.classify', data),
    );

    this.logger.debug(
      `Alarm ${data.name} classified as ${alarmClassification.category}`,
    );

    const notify$ = this.notificationsService.emit('notification.send', {
      alarm: data,
      category: alarmClassification.category,
    });

    await lastValueFrom(notify$);

    this.logger.debug(`Dispached "notification.send" event`);
  }
}
